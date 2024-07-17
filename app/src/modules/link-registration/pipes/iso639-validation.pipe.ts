import { PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import * as languageTags from 'language-tags';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ISO639ValidationPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(payload: CreateLinkRegistrationDto) {
    // Validate the ianaLanguage field within each response object in the responses array
    payload.responses.forEach((response) => {
      const errors = [];

      // Check if the provided IANA language code is valid
      const isIanaLanguageValid = this.isValidLanguageCode(
        response.ianaLanguage,
      );
      if (!isIanaLanguageValid) {
        errors.push({
          field: 'ianaLanguage',
          errorProperties: {
            key: 'invalid_iana_language',
            args: { tag: response.ianaLanguage },
          },
        });
      }

      if (errors.length > 0) {
        throw new FieldErrorsException(
          this.i18n,
          HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
        );
      }
    });

    return payload;
  }

  /**
   * Checks if the provided code is a valid ISO 639-1 language code.
   * @param code - The language code to validate.
   * @returns true if the code is valid, false otherwise.
   */
  private isValidLanguageCode(code: string): boolean {
    return languageTags.check(code.toLowerCase());
  }
}
