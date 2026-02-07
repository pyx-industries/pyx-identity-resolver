import { ConflictException } from '@nestjs/common';
import {
  CreateLinkRegistrationDto,
  Response,
} from '../dto/link-registration.dto';
import { VersionHistoryEntry } from '../interfaces/versioned-uri.interface';

/**
 * Builds a composite key for duplicate detection.
 * Two responses are considered duplicates when they share the same
 * targetUrl, linkType, mimeType, ianaLanguage, and context.
 */
export const buildResponseKey = (response: Response): string =>
  `${response.targetUrl}|${response.linkType}|${response.mimeType}|${response.ianaLanguage}|${response.context}`;

/**
 * Formats a response's identifying fields for use in error messages.
 */
export const formatResponseIdentity = (response: Response): string =>
  `linkType='${response.linkType}', mimeType='${response.mimeType}', ` +
  `ianaLanguage='${response.ianaLanguage}', context='${response.context}', ` +
  `targetUrl='${response.targetUrl}'`;

/**
 * Builds composite keys from version history entries by combining
 * previous* fields with the current response's values for fields
 * that weren't changed. Triggers when any previous* field is present.
 */
export const buildHistoricalKeys = (
  responses: Response[],
  versionHistory: VersionHistoryEntry[],
): Set<string> => {
  const keys = new Set<string>();
  const responsesByLinkId = new Map<string, Response>();

  for (const response of responses) {
    if (response.linkId) {
      responsesByLinkId.set(response.linkId, response);
    }
  }

  for (const entry of versionHistory) {
    for (const change of entry.changes) {
      if (
        !change.previousTargetUrl &&
        !change.previousLinkType &&
        !change.previousMimeType &&
        !change.previousIanaLanguage &&
        !change.previousContext
      )
        continue;

      const currentResponse = responsesByLinkId.get(change.linkId);
      if (!currentResponse) continue;

      const key =
        `${change.previousTargetUrl ?? currentResponse.targetUrl}|` +
        `${change.previousLinkType ?? currentResponse.linkType}|` +
        `${change.previousMimeType ?? currentResponse.mimeType}|` +
        `${change.previousIanaLanguage ?? currentResponse.ianaLanguage}|` +
        `${change.previousContext ?? currentResponse.context}`;
      keys.add(key);
    }
  }

  return keys;
};

/**
 * Process the incoming data with the existing data.
 * When an existing document is present, incoming responses are appended
 * to the existing responses (append-only). Throws ConflictException if
 * any incoming response duplicates an existing response or a previous
 * version of a response by composite key
 * (targetUrl + linkType + mimeType + ianaLanguage + context).
 * @param currentLinkRegistration - The current link registration data.
 * @param entryLinkRegistration - The incoming link registration data.
 * @param versionHistory - Version history from the stored document (optional).
 * @returns The updated link registration data.
 */
export const processEntryLinkRegistrationData = (
  currentLinkRegistration: CreateLinkRegistrationDto | undefined,
  entryLinkRegistration: CreateLinkRegistrationDto,
  versionHistory?: VersionHistoryEntry[],
): CreateLinkRegistrationDto => {
  if (!currentLinkRegistration) {
    return entryLinkRegistration;
  }

  const existingKeys = new Set(
    currentLinkRegistration.responses.map(buildResponseKey),
  );

  // Also check against previous versions of existing responses
  if (versionHistory?.length) {
    const historicalKeys = buildHistoricalKeys(
      currentLinkRegistration.responses,
      versionHistory,
    );
    for (const key of historicalKeys) {
      existingKeys.add(key);
    }
  }

  const duplicates = entryLinkRegistration.responses.filter((response) =>
    existingKeys.has(buildResponseKey(response)),
  );

  if (duplicates.length > 0) {
    const descriptions = duplicates.map(formatResponseIdentity).join('; ');
    throw new ConflictException(
      `Duplicate responses already exist: ${descriptions}`,
    );
  }

  return {
    ...entryLinkRegistration,
    responses: [
      ...currentLinkRegistration.responses,
      ...entryLinkRegistration.responses,
    ],
  };
};
