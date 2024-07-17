import { PipeTransform, Injectable, HttpStatus } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as countries from 'country-code-lookup';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

@Injectable()
/**
 * Pipe responsible for validating the context field of each response object in the responses array.
 * @implements {PipeTransform}
 * @export Bcp47ValidationPipe
 */
export class Bcp47ValidationPipe implements PipeTransform {
  constructor(private readonly i18n: I18nService) {}

  transform(payload: CreateLinkRegistrationDto) {
    // Validate the context field within each response object in the responses array
    payload.responses.forEach((response) => {
      // Check if the provided context code is a valid country code
      const isContextValid = this.isCountryCode(response.context);
      if (!isContextValid) {
        throw new FieldErrorsException(
          this.i18n,
          HttpStatus.UNPROCESSABLE_ENTITY,
          [
            {
              field: 'context',
              errorProperties: {
                key: 'invalid_context_code',
                args: { context: response.context },
              },
            },
          ],
        );
      }
    });

    return payload;
  }

  /**
   * Checks if the provided code is a valid country code.
   * @param countryCode - The country code to validate.
   * @returns true if the code is valid, false otherwise.
   */
  private isCountryCode(countryCode: string): boolean {
    const isValid = countries.byFips(countryCode.toLowerCase());
    if (!isValid) {
      return false;
    }

    return true;
  }
}
