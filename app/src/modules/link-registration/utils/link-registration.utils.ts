import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

/**
 * Generates the object name based on the registration payload.
 * @param payload - The registration payload.
 * @returns The object name.
 */
export function getObjectName(
  payload: CreateLinkRegistrationDto,
  aiCode: string,
): string {
  const path =
    payload.qualifierPath && payload.qualifierPath !== '/'
      ? `/${payload.namespace}/${aiCode}/${payload.identificationKey}${payload.qualifierPath}.json`
      : `/${payload.namespace}/${aiCode}/${payload.identificationKey}.json`;

  return path;
}
