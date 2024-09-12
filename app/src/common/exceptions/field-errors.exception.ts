import { HttpException, HttpStatus } from '@nestjs/common';
import { FieldError } from '../dto/errors.dto';
import { I18nService } from 'nestjs-i18n';

/**
 * Custom exception class for field errors.
 * Extends the HttpException class from the @nestjs/common package.
 *
 * @example
 * const errors = [
 *  { field: 'username', errorProperties: { key: 'isNotEmpty', property: 'username' } }
 * ];
 * const i18n = new I18nService();
 * throw new FieldErrorsException(i18n, HttpStatus.BAD_REQUEST, errors);
 */
export class FieldErrorsException extends HttpException {
  /**
   * Creates an instance of FieldErrorsException.
   * @param status - The HTTP status code for the exception.
   * @param errors - An array of FieldError objects representing the field errors.
   * @param lang - The language code for the error messages.
   */
  constructor(
    private readonly i18n: I18nService,
    status: HttpStatus,
    errors: FieldError[],
    lang: string = 'en',
  ) {
    const translatedErrors = errors.map((error) => ({
      field: error.field,
      message: i18n.translate(`errors.${error.errorProperties.key}`, {
        args: error.errorProperties.args,
        lang,
      }),
    }));

    super({ errors: translatedErrors }, status);
  }
}
