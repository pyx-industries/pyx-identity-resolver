import { PipeTransform, Injectable, HttpStatus, Inject } from '@nestjs/common';
import { FieldError } from '../../../common/dto/errors.dto';
import { IdentifierDto } from '../dto/identifier.dto';
import { ErrorCollector } from '../../../common/utils/errors.utils';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class IdentifierValidationPipe implements PipeTransform {
  constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

  /**
   * Transforms and validates the input identifierDto.
   * @param identifierDto - The identifier data to validate.
   * @returns The validated identifierDto.
   * @throws BadRequestException if validation fails.
   */
  transform(identifierDto: IdentifierDto): IdentifierDto {
    const errorCollector = new ErrorCollector<FieldError>();

    // Check for duplicate identifiers
    this.checkForDuplicateIdentifiers(
      identifierDto.applicationIdentifiers,
      errorCollector,
    );

    // Validate each identifier
    identifierDto.applicationIdentifiers.forEach((identifier) => {
      this.validateIdentifier(
        identifier,
        identifierDto.applicationIdentifiers,
        errorCollector,
      );
    });

    // If there are errors, translate and throw them
    if (errorCollector.hasErrors()) {
      throw new FieldErrorsException(
        this.i18n,
        HttpStatus.BAD_REQUEST,
        errorCollector.getErrors(),
      );
    }

    return identifierDto;
  }

  /**
   * Checks for duplicate identifiers in the list.
   * @param identifiers - The list of application identifiers.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private checkForDuplicateIdentifiers(
    identifiers: any[],
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    const seenAI = new Set<string>();
    const seenShortcode = new Set<string>();

    identifiers.forEach((identifier) => {
      if (seenAI.has(identifier.ai)) {
        errorCollector.addError({
          field: 'applicationIdentifiers',
          errorProperties: {
            key: 'duplicate_identifier',
            args: { aiOrShortcode: identifier.ai },
          },
        });
      } else {
        seenAI.add(identifier.ai);
      }

      if (seenShortcode.has(identifier.shortcode)) {
        errorCollector.addError({
          field: 'applicationIdentifiers',
          errorProperties: {
            key: 'duplicate_identifier',
            args: { aiOrShortcode: identifier.shortcode },
          },
        });
      } else {
        seenShortcode.add(identifier.shortcode);
      }
    });
  }

  /**
   * Validates a single identifier and its qualifiers.
   * @param identifier - The identifier to validate.
   * @param allIdentifiers - The list of all identifiers for reference.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private validateIdentifier(
    identifier: any,
    allIdentifiers: any[],
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    switch (identifier.type) {
      case 'I':
        this.validateQualifiers(identifier, allIdentifiers, errorCollector);
        break;
      case 'Q':
        this.validateQualifierParent(
          identifier,
          allIdentifiers,
          errorCollector,
        );
        break;
      case 'D':
        this.ensureNoQualifiers(identifier, errorCollector);
        break;
      default:
        errorCollector.addError({
          field: 'type',
          errorProperties: {
            key: 'unknown_identifier_type',
            args: { type: identifier.type },
          },
        });
        break;
    }

    this.validateRegex(identifier.regex, errorCollector);
  }

  /**
   * Validates the qualifiers of an identifier.
   * @param identifier - The identifier with qualifiers to validate.
   * @param allIdentifiers - The list of all identifiers for reference.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private validateQualifiers(
    identifier: any,
    allIdentifiers: any[],
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    if (identifier.qualifiers && identifier.qualifiers.length > 0) {
      identifier.qualifiers.forEach((qualifierAI) => {
        const qualifier = allIdentifiers.find(
          (id) =>
            (id.ai === qualifierAI || id.shortcode === qualifierAI) &&
            id.type === 'Q',
        );
        if (!qualifier) {
          errorCollector.addError({
            field: 'qualifiers',
            errorProperties: {
              key: 'qualifier_not_found',
              args: { aiOrShortcode: qualifierAI },
            },
          });
        } else if (qualifier.qualifiers && qualifier.qualifiers.length > 0) {
          errorCollector.addError({
            field: 'qualifiers',
            errorProperties: {
              key: 'qualifier_must_not_have_qualifiers',
              args: { aiOrShortcode: qualifierAI },
            },
          });
        }
      });
    }
  }

  /**
   * Ensures that a data attribute does not have qualifiers.
   * @param identifier - The data attribute identifier to check.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private ensureNoQualifiers(
    identifier: any,
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    const aiOrShortcode = identifier.ai || identifier.shortcode;
    if (identifier.qualifiers && identifier.qualifiers.length > 0) {
      errorCollector.addError({
        field: 'qualifiers',
        errorProperties: {
          key: 'data_attribute_must_not_have_qualifiers',
          args: { aiOrShortcode },
        },
      });
    }
  }

  /**
   * Validates that a qualifier is listed in its parent primary identifier's qualifiers array.
   * @param identifier - The qualifier identifier to validate.
   * @param allIdentifiers - The list of all identifiers for reference.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private validateQualifierParent(
    identifier: any,
    allIdentifiers: any[],
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    const aiOrShortcode = identifier.ai || identifier.shortcode;
    const parentIdentifier = allIdentifiers.find(
      (id) =>
        id.qualifiers &&
        id.qualifiers.some(
          (q) => q === identifier.ai || q === identifier.shortcode,
        ),
    );
    if (!parentIdentifier) {
      errorCollector.addError({
        field: 'qualifiers',
        errorProperties: {
          key: 'qualifier_not_part_of_primary',
          args: { aiOrShortcode },
        },
      });
    }
  }

  /**
   * Validates the provided regex pattern.
   * @param regex - The regex pattern to validate.
   * @param errorCollector - The error collector to collect any found issues.
   */
  private validateRegex(
    regex: string,
    errorCollector: ErrorCollector<FieldError>,
  ): void {
    try {
      new RegExp(regex);
    } catch (e) {
      errorCollector.addError({
        field: 'regex',
        errorProperties: {
          key: 'invalid_regex',
          args: { regex },
        },
      });
    }
  }
}
