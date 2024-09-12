import { appendOrOverrideForArrayChanges } from '../../shared/utils/upsert-mechanism.utils';
import { IdentifierDto } from '../dto/identifier.dto';

/**
 * Process the incoming data with the existing data.
 * @param currentIdentifier - The current identifier data.
 * @param entryIdentifier - The incoming identifier data.
 * @returns The updated identifier data.
 */
export const processEntryIdentifierData = (
  currentIdentifier: IdentifierDto | undefined,
  entryIdentifier: IdentifierDto,
): IdentifierDto => {
  if (!currentIdentifier) {
    return entryIdentifier;
  }
  const updatedApplicationIdentifiers = appendOrOverrideForArrayChanges(
    currentIdentifier.applicationIdentifiers,
    entryIdentifier.applicationIdentifiers,
    (ai) => {
      return ai.ai;
    },
  );
  return {
    ...entryIdentifier,
    applicationIdentifiers: updatedApplicationIdentifiers,
  };
};
