import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorProperties } from '../dto/errors.dto';
import { I18nService } from 'nestjs-i18n';

/**
 * Custom exception class for general errors.
 * Extends the HttpException class from the @nestjs/common package.
 *
 * @example
 * const error = { key: 'cannot_resolve_link', args: {} };
 * const i18n = new I18nService();
 * throw new GeneralErrorException(i18n, HttpStatus.INTERNAL_SERVER_ERROR, error);
 */
export class GeneralErrorException extends HttpException {
  /**
   * Creates an instance of GeneralErrorException.
   * @param status The HTTP status code of the exception.
   * @param error The error properties object.
   * @param lang The language code for the error message.
   */
  constructor(
    private readonly i18n: I18nService,
    status: HttpStatus,
    error: ErrorProperties,
    lang: string = 'en',
  ) {
    const translatedMessage = i18n.translate(`errors.${error.key}`, {
      args: error.args,
      lang,
    });
    super({ error: translatedMessage }, status);
  }
}
