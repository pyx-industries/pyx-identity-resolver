import { recalculateDefaultFlags } from '../modules/link-registration/utils/default-flags.utils';
import { constructLinkSetJson } from '../modules/link-registration/utils/link-set.utils';
import {
  LinkChange,
  Uri,
  VersionHistoryEntry,
} from '../modules/link-resolution/interfaces/uri.interface';

/**
 * Legacy (pre-#120) response shape: variants carried a scalar `ianaLanguage`
 * and a per-variant `defaultIanaLanguage` boolean. The new model drops both
 * in favour of an `hreflang: string[]` array on each variant.
 */
type LegacyLinkResponse = {
  targetUrl: string;
  title?: string;
  linkType: string;
  context: string;
  mimeType: string;
  active?: boolean;
  fwqs?: boolean;
  defaultLinkType?: boolean;
  defaultContext?: boolean;
  defaultMimeType?: boolean;
  linkId?: string;
  createdAt?: string;
  updatedAt?: string;
  encryptionMethod?: string;
  accessRole?: string[];
  method?: string;
  public?: boolean;
  rel?: string[];
  hreflang?: string[];
  ianaLanguage?: string;
  defaultIanaLanguage?: boolean;
};

type LegacyLinkChange = LinkChange & { previousIanaLanguage?: string };

type LegacyVersionHistoryEntry = {
  version: number;
  updatedAt: string;
  changes: LegacyLinkChange[];
};

type LegacyUri = Omit<Uri, 'responses' | 'versionHistory'> & {
  responses: LegacyLinkResponse[];
  versionHistory?: LegacyVersionHistoryEntry[];
};

/**
 * Summary of one migration applied to a single URI document.
 */
export interface MigrationOutcome {
  /** `true` if any field of the input doc was mutated. */
  mutated: boolean;
  /** Source response count before the merge. */
  inputResponseCount: number;
  /** Response count after the 4-tuple merge. */
  outputResponseCount: number;
  /** Number of versionHistory entries rewritten (legacy → hreflang). */
  rewrittenVersionEntries: number;
  /**
   * `linkId`s that existed on a source variant but did not survive the
   * 4-tuple merge. Callers should clean up the corresponding
   * `_index/links/<linkId>.json` index entries so post-migration lookups
   * by these linkIds fail fast rather than leaving orphan index files.
   */
  discardedLinkIds: string[];
}

/**
 * Migrate a single URI document from the legacy 5-tuple key model
 * (`targetUrl, linkType, mimeType, ianaLanguage, context`) to the v4 4-tuple
 * model (`targetUrl, linkType, mimeType, context`) with a merged
 * `hreflang: string[]` array per variant.
 *
 * Idempotent: a document already in 4-tuple shape returns
 * `{ mutated: false, ... }` and the input doc is returned unchanged.
 *
 * Conflict resolution (when two legacy variants share the new 4-tuple but
 * disagree on other metadata): **first-registered wins** by `createdAt`.
 * Variants without `createdAt` sort after timestamped variants; ties
 * (both timestamped equal, or both untimestamped) preserve original
 * registration order via a stable sort. Discarded variants' `ianaLanguage`
 * values are unioned into the survivor's `hreflang[]`. Discarded
 * variants' `linkId`s are dropped from the document; their identifiers
 * are returned in {@link MigrationOutcome.discardedLinkIds} so the
 * caller can delete the corresponding `_index/links/<linkId>.json`
 * orphan files. The merge does NOT append a synthetic version-history
 * entry; the only audit signal is the post-migration `discardedLinkIds`
 * report.
 *
 * Side effects on the returned document:
 * - Removes `ianaLanguage` and `defaultIanaLanguage` fields from every
 *   response (both gone in the v4 model).
 * - Rewrites `versionHistory[].changes[].previousIanaLanguage` to
 *   `previousHreflang: [previousIanaLanguage]`.
 * - Re-runs `recalculateDefaultFlags` so the v4 scopes (per linkType for
 *   `defaultContext`, per linkType + context for `defaultMimeType`) hold.
 * - Rebuilds `linkset` from the merged responses via
 *   `constructLinkSetJson`, passing the rewritten `versionHistory` so
 *   `predecessor-version` link target entries are preserved.
 *
 * The 4-tuple key is **case-sensitive** on every component
 * (`targetUrl, linkType, mimeType, context`), matching the live
 * `buildResponseKey` in `link-registration/utils/upsert.utils.ts` and
 * RFC 3986 §6.2.2.1 path-segment semantics. Two variants whose only
 * difference is letter case on any of those four fields are treated as
 * distinct records by the migration, same as by the live registration
 * service.
 *
 * @param input The stored URI document (may already be in v4 shape).
 * @param attrs Resolver attributes needed to rebuild the linkset.
 * @returns A tuple of the migrated document (or the original if no-op)
 *   and a {@link MigrationOutcome} describing what changed.
 */
export function migrateUriDocument(
  input: LegacyUri,
  attrs: { resolverDomain: string; linkTypeVocDomain: string },
): { document: Uri; outcome: MigrationOutcome } {
  const responses = Array.isArray(input.responses) ? input.responses : [];
  const versionHistory = Array.isArray(input.versionHistory)
    ? input.versionHistory
    : undefined;

  const hasLegacyResponseField = responses.some(
    (r) => 'ianaLanguage' in r || 'defaultIanaLanguage' in r,
  );
  const hasLegacyVersionField = versionHistory?.some((entry) =>
    entry.changes.some((change) => 'previousIanaLanguage' in change),
  );

  if (!hasLegacyResponseField && !hasLegacyVersionField) {
    return {
      document: input as unknown as Uri,
      outcome: {
        mutated: false,
        inputResponseCount: responses.length,
        outputResponseCount: responses.length,
        rewrittenVersionEntries: 0,
        discardedLinkIds: [],
      },
    };
  }

  const { merged: mergedResponses, discardedLinkIds } =
    mergeResponsesByFourTuple(responses);
  recalculateDefaultFlags(mergedResponses as any);

  const { entries, rewrittenCount } = rewriteVersionHistory(versionHistory);

  const aiCode = deriveAiCode(input.id, input.namespace);
  const linksetInput = {
    namespace: input.namespace,
    identificationKeyType: input.identificationKeyType,
    identificationKey: input.identificationKey,
    qualifierPath: input.qualifierPath,
    active: input.active,
    description: input.description,
    responses: mergedResponses.filter((r) => r.active !== false) as any,
  };
  // `versionHistory` (post-rewrite) is passed so `constructLinkSetJson`
  // emits `predecessor-version` link target entries for any change with
  // a `previousTargetUrl`. Omitting it silently dropped predecessor
  // links from the rebuilt linkset until the next live update.
  const linkset = constructLinkSetJson(linksetInput, aiCode, attrs, entries);

  const document: Uri = {
    ...input,
    responses: mergedResponses as any,
    linkset,
    versionHistory: entries,
  };

  return {
    document,
    outcome: {
      mutated: true,
      inputResponseCount: responses.length,
      outputResponseCount: mergedResponses.length,
      rewrittenVersionEntries: rewrittenCount,
      discardedLinkIds,
    },
  };
}

/**
 * Groups legacy responses by the new v4 4-tuple
 * (`targetUrl, linkType, mimeType, context`) and merges each group into a
 * single response. Within a group, the **first-registered** variant (by
 * `createdAt`; untimestamped variants sort after timestamped ones; ties
 * preserve original registration order via a stable sort) becomes the
 * canonical record; the others contribute their `ianaLanguage` values
 * to the merged `hreflang[]` array.
 *
 * Discarded variants' other metadata (titles, flags, accessRole, etc.)
 * is NOT preserved. Their `linkId`s are collected in the returned
 * `discardedLinkIds` array so the caller can delete the corresponding
 * `_index/links/<linkId>.json` orphan files; no synthetic version
 * history entry is appended. Operators with divergent metadata on
 * otherwise-identical 4-tuple variants should reconcile those manually
 * before migrating (see the v4 migration guide).
 */
function mergeResponsesByFourTuple(responses: LegacyLinkResponse[]): {
  merged: LegacyLinkResponse[];
  discardedLinkIds: string[];
} {
  const groups = new Map<string, LegacyLinkResponse[]>();
  for (const response of responses) {
    const key = fourTupleKey(response);
    const group = groups.get(key) ?? [];
    group.push(response);
    groups.set(key, group);
  }

  const merged: LegacyLinkResponse[] = [];
  const discardedLinkIds: string[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      merged.push(stripLegacyFields(group[0], collectHreflangTags(group)));
      continue;
    }

    const sorted = [...group].sort(compareByCreatedAt);
    const survivor = stripLegacyFields(sorted[0], collectHreflangTags(group));
    const discarded = sorted.slice(1);

    if (discarded.length) {
      survivor.updatedAt = survivor.updatedAt ?? new Date().toISOString();
      for (const variant of discarded) {
        if (variant.linkId && variant.linkId !== survivor.linkId) {
          discardedLinkIds.push(variant.linkId);
        }
      }
    }

    merged.push(survivor);
  }

  return { merged, discardedLinkIds };
}

/**
 * Removes the legacy `ianaLanguage` and `defaultIanaLanguage` fields from
 * a response and replaces them with the merged `hreflang[]` value.
 */
function stripLegacyFields(
  response: LegacyLinkResponse,
  hreflang: string[],
): LegacyLinkResponse {
  const {
    ianaLanguage: _ianaLanguage,
    defaultIanaLanguage: _defaultIanaLanguage,
    ...rest
  } = response;
  void _ianaLanguage;
  void _defaultIanaLanguage;
  return { ...rest, hreflang };
}

/**
 * Collects the merged `hreflang[]` for a group: union of each variant's
 * existing `hreflang` (if any) and its legacy `ianaLanguage` (if any),
 * deduplicated case-insensitively while preserving first-seen casing.
 * Returns the array in stable order: existing tags from the
 * first-registered survivor first, then legacy `ianaLanguage` values in
 * the order of the discarded variants.
 */
function collectHreflangTags(group: LegacyLinkResponse[]): string[] {
  const seen = new Map<string, string>();
  for (const response of group) {
    for (const tag of response.hreflang ?? []) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, tag);
      }
    }
  }
  for (const response of group) {
    const legacy = response.ianaLanguage?.trim();
    if (!legacy) continue;
    const key = legacy.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, legacy);
    }
  }
  return Array.from(seen.values());
}

/**
 * Rewrites the version history so that each legacy
 * `previousIanaLanguage` scalar becomes a `previousHreflang: [value]`
 * single-element array on the same change record. An empty or
 * whitespace-only `previousIanaLanguage` is dropped (no
 * `previousHreflang` field added), matching the live registration
 * behaviour. Other change fields are passed through unchanged. Returns
 * the new entries plus a count of how many records were touched.
 */
function rewriteVersionHistory(
  versionHistory: LegacyVersionHistoryEntry[] | undefined,
): { entries: VersionHistoryEntry[] | undefined; rewrittenCount: number } {
  if (!versionHistory) {
    return { entries: undefined, rewrittenCount: 0 };
  }
  let rewrittenCount = 0;
  const entries = versionHistory.map((entry) => {
    const changes = entry.changes.map((change) => {
      if (!('previousIanaLanguage' in change)) {
        return change;
      }
      rewrittenCount += 1;
      const { previousIanaLanguage, ...rest } = change;
      const value = previousIanaLanguage?.trim();
      if (!value) {
        return rest as LinkChange;
      }
      return { ...rest, previousHreflang: [value] } as LinkChange;
    });
    return { ...entry, changes };
  });
  return { entries, rewrittenCount };
}

function fourTupleKey(response: LegacyLinkResponse): string {
  return [
    response.targetUrl,
    response.linkType,
    response.mimeType,
    response.context,
  ]
    .map((segment) => segment ?? '')
    .join('|');
}

/**
 * Orders variants oldest-first by `createdAt`. Untimestamped variants
 * sort after timestamped ones so a real `createdAt` always wins
 * "first-registered". Ties (including untimestamped vs untimestamped)
 * fall back to the stable sort's original order.
 */
function compareByCreatedAt(
  a: LegacyLinkResponse,
  b: LegacyLinkResponse,
): number {
  const aCreated = a.createdAt ? Date.parse(a.createdAt) : NaN;
  const bCreated = b.createdAt ? Date.parse(b.createdAt) : NaN;
  if (Number.isFinite(aCreated) && Number.isFinite(bCreated)) {
    return aCreated - bCreated;
  }
  if (Number.isFinite(aCreated)) return -1;
  if (Number.isFinite(bCreated)) return 1;
  return 0;
}

/**
 * Recovers the AI code from a stored document's `id` so the rebuilt
 * linkset's anchor lines up with the v4 URL structure
 * (`{namespace}/{aiCode}/{identificationKey}[/qualifierPath]`).
 *
 * Stored IDs follow the pattern `{namespace}/{aiCode}/{rest}` where
 * `{rest}` is the identificationKey (optionally followed by a qualifier
 * path). The aiCode is the second path segment.
 */
function deriveAiCode(id: string, namespace: string): string {
  if (!id) return '';
  const trimmed = id.endsWith('.json') ? id.slice(0, -'.json'.length) : id;
  const prefix = `${namespace}/`;
  const withoutNamespace = trimmed.startsWith(prefix)
    ? trimmed.slice(prefix.length)
    : trimmed;
  const [aiCode] = withoutNamespace.split('/');
  return aiCode ?? '';
}
