import { LinkResponse } from '../../link-resolution/interfaces/uri.interface';

/**
 * Recalculates default flags on an array of link responses, ensuring
 * exactly one active response has each default flag set to `true` within
 * its scope.
 *
 * Scope definitions:
 * - `defaultLinkType`: global (entire responses array)
 * - `defaultIanaLanguage`: per linkType
 * - `defaultContext`: per linkType + ianaLanguage
 * - `defaultMimeType`: per linkType + ianaLanguage + context
 *
 * Rules:
 * - Only active responses (where `active !== false`) may hold a default flag.
 * - Inactive responses always have their default flags set to `false`.
 * - If multiple active responses claim a default in the same scope, the last
 *   one in array order wins.
 * - If no active response in a scope has the default flag set, the first
 *   active response in that scope is promoted.
 *
 * Mutates the array in place and returns it for convenience.
 */
export function recalculateDefaultFlags(
  responses: LinkResponse[],
): LinkResponse[] {
  if (!responses || responses.length === 0) {
    return responses;
  }

  // Clear all default flags on inactive responses first
  for (const response of responses) {
    if (response.active === false) {
      response.defaultLinkType = false;
      response.defaultIanaLanguage = false;
      response.defaultContext = false;
      response.defaultMimeType = false;
    }
  }

  enforceDefaultLinkType(responses);
  enforceDefaultIanaLanguage(responses);
  enforceDefaultContext(responses);
  enforceDefaultMimeType(responses);

  return responses;
}

/**
 * Normalises a string key for case-insensitive scope grouping.
 */
function normaliseKey(value: string): string {
  return value?.toLowerCase() ?? '';
}

/**
 * Ensures exactly one active response has `defaultLinkType: true` globally.
 */
function enforceDefaultLinkType(responses: LinkResponse[]): void {
  let lastDefaultIndex = -1;

  for (let i = 0; i < responses.length; i++) {
    if (responses[i].active !== false && responses[i].defaultLinkType) {
      lastDefaultIndex = i;
    }
  }

  // If no active response has the default, promote the first active one
  if (lastDefaultIndex === -1) {
    const firstActive = responses.findIndex((r) => r.active !== false);
    if (firstActive !== -1) {
      responses[firstActive].defaultLinkType = true;
      lastDefaultIndex = firstActive;
    }
  }

  // Unset all others
  for (let i = 0; i < responses.length; i++) {
    if (i !== lastDefaultIndex && responses[i].defaultLinkType) {
      responses[i].defaultLinkType = false;
    }
  }
}

/**
 * Ensures exactly one active response has `defaultIanaLanguage: true` per linkType.
 */
function enforceDefaultIanaLanguage(responses: LinkResponse[]): void {
  enforceScopedDefault(responses, 'defaultIanaLanguage', (r) =>
    normaliseKey(r.linkType),
  );
}

/**
 * Ensures exactly one active response has `defaultContext: true` per linkType + ianaLanguage.
 */
function enforceDefaultContext(responses: LinkResponse[]): void {
  enforceScopedDefault(
    responses,
    'defaultContext',
    (r) => `${normaliseKey(r.linkType)}|${normaliseKey(r.ianaLanguage)}`,
  );
}

/**
 * Ensures exactly one active response has `defaultMimeType: true` per linkType + ianaLanguage + context.
 */
function enforceDefaultMimeType(responses: LinkResponse[]): void {
  enforceScopedDefault(
    responses,
    'defaultMimeType',
    (r) =>
      `${normaliseKey(r.linkType)}|${normaliseKey(r.ianaLanguage)}|${normaliseKey(r.context)}`,
  );
}

/**
 * Generic helper that enforces a single default flag within each scope group.
 *
 * For each scope:
 * 1. Find the last active response with the flag set to `true` (last wins).
 * 2. If none, promote the first active response in that scope.
 * 3. Unset the flag on all other responses in that scope.
 */
function enforceScopedDefault(
  responses: LinkResponse[],
  flag: 'defaultIanaLanguage' | 'defaultContext' | 'defaultMimeType',
  scopeKeyFn: (r: LinkResponse) => string,
): void {
  // Group active response indices by scope
  const scopeGroups = new Map<string, number[]>();
  const lastDefaultByScope = new Map<string, number>();

  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (r.active === false) continue;
    const key = scopeKeyFn(r);

    if (!scopeGroups.has(key)) {
      scopeGroups.set(key, []);
    }
    scopeGroups.get(key)!.push(i);

    if (r[flag]) {
      lastDefaultByScope.set(key, i);
    }
  }

  // Promote first active in scope if no default exists
  for (const [key, indices] of scopeGroups) {
    if (!lastDefaultByScope.has(key) && indices.length > 0) {
      responses[indices[0]][flag] = true;
      lastDefaultByScope.set(key, indices[0]);
    }
  }

  // Unset all except the chosen default per scope
  for (let i = 0; i < responses.length; i++) {
    if (responses[i][flag]) {
      const key = scopeKeyFn(responses[i]);
      const chosenIndex = lastDefaultByScope.get(key);
      if (chosenIndex !== undefined && i !== chosenIndex) {
        responses[i][flag] = false;
      }
    }
  }
}
