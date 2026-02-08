import { LinkResponse } from '../interfaces/uri.interface';

/**
 * Normalise an access-role value using URI fragment convention.
 *
 * Accepts either a full URI (e.g. "untp:accessRole#Customer") or a shorthand
 * fragment (e.g. "customer", "REGULATOR"). Shorthand values are expanded to
 * the `untp:accessRole#Fragment` format with the first letter capitalised.
 *
 * This is intentionally scheme-agnostic — it applies a URI convention rather
 * than checking against a fixed enum, so new roles work without code changes.
 */
export const normaliseAccessRole = (value: string): string => {
  if (value.includes(':')) {
    return value;
  }

  const capitalised =
    value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  return `untp:accessRole#${capitalised}`;
};

/**
 * Filter an array of {@link LinkResponse} entries by the requested access role.
 *
 * Behaviour:
 * - If no `accessRole` is provided (undefined or empty string), all responses
 *   are returned unchanged.
 * - Responses whose `accessRole` field is undefined, null, or an empty array
 *   are treated as public and are always included.
 * - Responses whose `accessRole` array contains the normalised role are
 *   included.
 * - All other responses are excluded.
 */
export const filterByAccessRole = (
  responses: LinkResponse[],
  accessRole?: string,
): LinkResponse[] => {
  if (!accessRole) {
    return responses;
  }

  const normalised = normaliseAccessRole(accessRole);

  return responses.filter((response) => {
    // Public responses (no access-role restriction) are always included
    if (!response.accessRole || response.accessRole.length === 0) {
      return true;
    }

    return response.accessRole.includes(normalised);
  });
};
