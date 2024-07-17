import { BadRequestException } from '@nestjs/common';
import {
  IdentifierParameter,
  IdentifierParameters,
} from '../../identifier-management/interfaces/identifier.interface';
import { LinkResolutionDto } from '../../link-resolution/dto/link-resolution.dto';
import { CreateLinkRegistrationDto } from '../../link-registration/dto/link-registration.dto';
import { ApplicationIdentifier } from '../../identifier-management/dto/identifier.dto';

/**
 * Constructs an ID string based on the provided identifier parameters.
 * @param identifierParams - The parameters used to construct the ID.
 * @returns The constructed ID string.
 */
export function constructID(identifierParams: LinkResolutionDto): string {
  if (
    identifierParams &&
    identifierParams.namespace &&
    identifierParams.identifiers.primary &&
    identifierParams.identifiers.primary.qualifier &&
    identifierParams.identifiers.primary.id
  ) {
    const baseId = `${identifierParams.namespace}/${identifierParams.identifiers.primary.qualifier}/${identifierParams.identifiers.primary.id}`;

    if (
      identifierParams.identifiers.secondaries &&
      identifierParams.identifiers.secondaries.length > 0
    ) {
      const secondaryIds = identifierParams.identifiers.secondaries.map(
        (secondary) => `${secondary.qualifier}/${secondary.id}`,
      );
      return `${baseId}/${secondaryIds.join('/')}.json`;
    }
    return `${baseId}.json`;
  }

  throw new Error('Invalid identifier parameters');
}

export function constructQualifiersFromQualifierPath(
  qualifierPath: string,
): IdentifierParameter[] {
  // Split the qualifier path into parts, with qualifier path like 'qualifier1/id1/qualifier2/id2' or '/qualifier1/id1/qualifier2/id2'.
  const qualifierPathParts =
    qualifierPath && qualifierPath !== '/' ? qualifierPath.split('/') : [];
  if (qualifierPathParts[0] === '') {
    qualifierPathParts.shift();
  }

  const qualifiers: IdentifierParameter[] = [];
  for (let i = 0; i < qualifierPathParts.length; i += 2) {
    const qualifier = qualifierPathParts[i];
    const id = qualifierPathParts[i + 1];
    if (id) {
      qualifiers.push({ qualifier, id });
    } else {
      throw new BadRequestException('Invalid request data');
    }
  }
  return qualifiers;
}

export function constructIdentifierParametersFromLinkResolutionDto(
  linkResolutionDto: LinkResolutionDto,
): IdentifierParameters {
  const primary = linkResolutionDto.identifiers.primary;
  const secondaries = linkResolutionDto.identifiers.secondaries;

  return {
    namespace: linkResolutionDto.namespace,
    primary: {
      qualifier: primary.qualifier,
      id: primary.id,
    },
    secondaries,
  };
}

export function constructIdentifierParametersFromCreateLinkRegistrationDto(
  createLinkRegistrationDto: CreateLinkRegistrationDto,
): IdentifierParameters {
  const primary = {
    qualifier: createLinkRegistrationDto.identificationKeyType,
    id: createLinkRegistrationDto.identificationKey,
  };
  const secondaries = constructQualifiersFromQualifierPath(
    createLinkRegistrationDto.qualifierPath,
  );

  return {
    namespace: createLinkRegistrationDto.namespace,
    primary,
    secondaries,
  };
}

export const convertAICode = (
  code: string,
  allIdentifiers: ApplicationIdentifier[],
): string | undefined => {
  const identifier = allIdentifiers.find(
    (ai) => ai.shortcode === code || ai.ai === code,
  );
  if (identifier) {
    return identifier.ai;
  }
  return undefined;
};
