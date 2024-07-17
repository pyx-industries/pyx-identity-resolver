import { FieldError } from '../../../common/dto/errors.dto';
import { ErrorCollector } from '../../../common/utils/errors.utils';
import { ApplicationIdentifier } from '../dto/identifier.dto';
import {
  IdentifierParameter,
  IdentifierParameters,
  IdentifierType,
} from '../interfaces/identifier.interface';

export const validateIdentifierQualifiersSetFactory = (
  identifiers: IdentifierParameters,
  allIdentifiers: ApplicationIdentifier[],
  errorCollector: ErrorCollector<FieldError>,
): void => {
  const primaryAI = allIdentifiers.find(
    (ai) =>
      ai.type === IdentifierType.Identifier &&
      (ai.shortcode === identifiers.primary.qualifier ||
        ai.ai === identifiers.primary.qualifier),
  );
  if (!primaryAI) {
    errorCollector.addError({
      field: 'primary',
      errorProperties: {
        key: 'primary_identifier_not_found',
        args: { aiOrShortcode: identifiers.primary.qualifier },
      },
    });

    return;
  }

  validateRegexFactory(
    'identificationKey',
    identifiers.primary.id,
    primaryAI.regex,
    errorCollector,
  );

  validateQualifierFactory(
    primaryAI,
    identifiers.secondaries,
    allIdentifiers,
    errorCollector,
  );
};

const validateQualifierFactory = (
  primaryIdentifier: ApplicationIdentifier,
  qualifiers: IdentifierParameter[],
  allIdentifiers: ApplicationIdentifier[],
  errorCollector: ErrorCollector<FieldError>,
): void => {
  const { notExistingQualifiers, existingQualifiers } = qualifiers.reduce(
    (acc, qualifier) => {
      const qualifierAI = allIdentifiers.find(
        (ai) =>
          ai.type === IdentifierType.Qualifier &&
          (ai.ai === qualifier.qualifier ||
            ai.shortcode === qualifier.qualifier),
      );

      if (
        qualifierAI &&
        primaryIdentifier.qualifiers.includes(qualifierAI.ai)
      ) {
        acc.existingQualifiers.push({ ...qualifier, regex: qualifierAI.regex });
      } else {
        acc.notExistingQualifiers.push({
          ...qualifier,
        });
      }

      return acc;
    },
    { notExistingQualifiers: [], existingQualifiers: [] },
  );

  notExistingQualifiers.forEach((qualifier) => {
    errorCollector.addError({
      field: 'qualifiers',
      errorProperties: {
        key: 'qualifier_not_found',
        args: { aiOrShortcode: qualifier.qualifier },
      },
    });
  });

  existingQualifiers.forEach(({ id, regex }) => {
    validateRegexFactory('qualifierPath', id, regex, errorCollector);
  });
};

const validateRegexFactory = (
  field: string,
  value: string,
  regex: string,
  errorCollector: ErrorCollector<FieldError>,
): void => {
  if (!new RegExp(regex).test(value)) {
    errorCollector.addError({
      field,
      errorProperties: {
        key: 'invalid_value',
        args: { value, regex },
      },
    });
  }
};
