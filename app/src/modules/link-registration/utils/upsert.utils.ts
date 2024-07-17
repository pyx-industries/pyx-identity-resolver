import { appendOrOverrideForArrayChanges } from '../../shared/utils/upsert-mechanism.utils';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

/**
 * Process the incoming data with the existing data.
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
  const updatedResponses = appendOrOverrideForArrayChanges(
    currentLinkRegistration.responses,
    entryLinkRegistration.responses,
    (response) => {
      return `${response.targetUrl}-${response.linkType}-${response.mimeType}-${response.ianaLanguage}-${response.context}`;
    },
  );

  return {
    ...entryLinkRegistration,
    responses: updatedResponses,
  };
};
