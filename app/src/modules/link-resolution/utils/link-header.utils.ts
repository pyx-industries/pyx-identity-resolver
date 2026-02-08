import { Logger } from '@nestjs/common';
import { ResolutionContext } from '../interfaces/link-resolution.interface';
import { LinkResponse } from '../interfaces/uri.interface';

const logger = new Logger('LinkHeaderUtils');

/**
 * Build the canonical URL for a resolved identifier.
 *
 * Duplicates the URL construction logic from `buildOriginalRequest` in
 * link-set.utils.ts but accepts a {@link ResolutionContext} instead of
 * raw URI + attrs. If URL construction logic changes, both must be updated.
 */
export const buildCanonicalUrl = (ctx: ResolutionContext): string =>
  `${ctx.resolverDomain}/${ctx.namespace}/${ctx.identificationKeyCode}/${ctx.identificationKey}${ctx.qualifierPath === '/' ? '' : ctx.qualifierPath}`;

/**
 * Peel qualifier pairs from the right of {@link ResolutionContext.qualifierPath}
 * and return up to 3 nearest ancestor linkset reference entries.
 *
 * The qualifier path format is `/key/value` pairs, e.g. `/10/LOT1234/21/SER5678`.
 * Each ancestor entry is an RFC 8288 `rel="linkset"` reference pointing at the
 * ancestor's `?linkType=all` representation.
 *
 * @returns An array of linkset reference strings, nearest ancestor first,
 *   capped at 3 entries. Empty when there are no qualifiers.
 */
export const buildParentLinksetRefs = (ctx: ResolutionContext): string[] => {
  const normalisedPath =
    !ctx.qualifierPath || ctx.qualifierPath === '/' ? '' : ctx.qualifierPath;

  if (normalisedPath === '') {
    return [];
  }

  // Split into non-empty segments and pair them up
  const segments = normalisedPath.split('/').filter((s) => s !== '');
  const pairCount = Math.floor(segments.length / 2);

  if (pairCount === 0) {
    return [];
  }

  const baseUrl = `${ctx.resolverDomain}/${ctx.namespace}/${ctx.identificationKeyCode}/${ctx.identificationKey}`;
  const accessRoleSuffix = ctx.accessRole
    ? `&accessRole=${ctx.accessRole}`
    : '';

  const refs: string[] = [];

  // Peel from the right, nearest ancestor first
  for (let i = pairCount - 1; i >= 0 && refs.length < 3; i--) {
    const ancestorSegments = segments.slice(0, i * 2);
    const ancestorPath =
      ancestorSegments.length > 0 ? `/${ancestorSegments.join('/')}` : '';
    const url = `${baseUrl}${ancestorPath}?linkType=all${accessRoleSuffix}`;
    refs.push(`<${url}>; rel="linkset"; type="application/linkset+json"`);
  }

  return refs;
};

/**
 * Build a single target link entry from a {@link LinkResponse}.
 */
const buildTargetEntry = (response: LinkResponse): string =>
  `<${response.targetUrl}>; rel="${response.linkType}"; type="${response.mimeType}"; hreflang="${response.ianaLanguage}"; title="${response.title}"`;

/**
 * Construct both variants of the HTTP Link header for a resolved identifier.
 *
 * - `linkHeaderText` — filtered by `resolvedLinkType` and size-bounded by
 *   `ctx.linkHeaderMaxSize`. If the total header exceeds the budget, all
 *   target links are dropped (all-or-nothing) and only mandatory entries
 *   (owl:sameAs, self linkset ref, parent refs) are retained.
 *
 * - `linkHeaderTextFull` — all active responses, unbounded.
 *
 * @param responses     All responses for the URI (active + inactive).
 * @param ctx           Resolution context carrying domain, path, and size config.
 * @param resolvedLinkType  When provided, filters target links in `linkHeaderText`
 *                          to those whose `linkType` matches. When `undefined`,
 *                          all active responses are included (linkType=all).
 */
export const constructLinkHeader = (
  responses: LinkResponse[],
  ctx: ResolutionContext,
  resolvedLinkType?: string,
): { linkHeaderText: string; linkHeaderTextFull: string } => {
  const activeResponses = responses.filter((r) => r.active);
  const canonicalUrl = buildCanonicalUrl(ctx);

  // --- Mandatory entries (exempt from size budget) ---
  const owlSameAs = `<${canonicalUrl}>; rel="owl:sameAs"`;

  const accessRoleSuffix = ctx.accessRole
    ? `&accessRole=${ctx.accessRole}`
    : '';
  const selfLinkset = `<${canonicalUrl}?linkType=all${accessRoleSuffix}>; rel="linkset"; type="application/linkset+json"`;

  const parentRefs = buildParentLinksetRefs(ctx);

  const mandatoryEntries = [owlSameAs, selfLinkset, ...parentRefs];

  // --- Target link entries ---
  const allTargetEntries = activeResponses.map(buildTargetEntry);

  const filteredTargetEntries =
    resolvedLinkType !== undefined
      ? activeResponses
          .filter((r) => r.linkType === resolvedLinkType)
          .map(buildTargetEntry)
      : allTargetEntries;

  // --- linkHeaderTextFull: all active targets, no size limit ---
  const linkHeaderTextFull = [...mandatoryEntries, ...allTargetEntries].join(
    ', ',
  );

  // --- linkHeaderText: filtered targets, size-bounded ---
  const fullCandidate = [...mandatoryEntries, ...filteredTargetEntries].join(
    ', ',
  );
  const fullCandidateSize = Buffer.byteLength(fullCandidate, 'utf-8');

  if (fullCandidateSize <= ctx.linkHeaderMaxSize) {
    return { linkHeaderText: fullCandidate, linkHeaderTextFull };
  }

  // Exceeds budget — drop ALL target links
  const mandatoryOnly = mandatoryEntries.join(', ');
  const mandatorySize = Buffer.byteLength(mandatoryOnly, 'utf-8');

  if (mandatorySize > ctx.linkHeaderMaxSize) {
    logger.warn(
      `Link header mandatory entries (${mandatorySize} bytes) exceed configured limit (${ctx.linkHeaderMaxSize} bytes) for ${canonicalUrl}`,
    );
  } else {
    logger.warn(
      `Link header truncated for ${canonicalUrl}: target links removed to stay within ${ctx.linkHeaderMaxSize} byte limit`,
    );
  }

  return { linkHeaderText: mandatoryOnly, linkHeaderTextFull };
};
