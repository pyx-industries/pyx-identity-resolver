import { appendOrOverrideForArrayChanges } from '../../shared/utils/upsert-mechanism.utils';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

/**
 * Builds the unique key for a response used during merge comparisons.
 * The key is a composite of targetUrl, linkType, mimeType, ianaLanguage, and context.
 */
const buildResponseKey = (response: any): string => {
  return `${response.targetUrl}-${response.linkType}-${response.mimeType}-${response.ianaLanguage}-${response.context}`;
};

/**
 * Process the incoming data with the existing data.
 * When merging responses, existing linkIds and createdAt timestamps are preserved
 * so that previously assigned identifiers survive an upsert operation.
 * @param currentLinkRegistration - The current link registration data.
 * @param entryLinkRegistration - The incoming link registration data.
 * @returns The updated link registration data.
 */
export const processEntryLinkRegistrationData = (
  currentLinkRegistration: CreateLinkRegistrationDto | undefined,
  entryLinkRegistration: CreateLinkRegistrationDto,
): CreateLinkRegistrationDto => {
  if (!currentLinkRegistration) {
    return entryLinkRegistration;
  }

  // Build a map of existing responses by their unique key to preserve linkIds
  const existingResponseMap = new Map<string, any>();
  currentLinkRegistration.responses.forEach((response: any) => {
    const key = buildResponseKey(response);
    existingResponseMap.set(key, response);
  });

  const updatedResponses = appendOrOverrideForArrayChanges(
    currentLinkRegistration.responses,
    entryLinkRegistration.responses,
    buildResponseKey,
  );

  // Preserve linkIds and createdAt from existing responses
  const responsesWithLinkIds = updatedResponses.map((response: any) => {
    const key = buildResponseKey(response);
    const existing = existingResponseMap.get(key);
    if (existing?.linkId && !response.linkId) {
      return {
        ...response,
        linkId: existing.linkId,
        createdAt: existing.createdAt,
      };
    }
    return response;
  });

  return {
    ...entryLinkRegistration,
    responses: responsesWithLinkIds,
  };
};
