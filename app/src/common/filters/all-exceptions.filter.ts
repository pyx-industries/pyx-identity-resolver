import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Exception filter that handles all exceptions thrown in the application.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      if (status >= 500) {
        this.logger.error(
          `${request.method} ${request.url} — ${status}`,
          exception instanceof Error ? exception.stack : String(exception),
        );
      } else if (status === 401 || status === 403) {
        this.logger.warn(`${request.method} ${request.url} — ${status}`);
      }

      const exceptionResponse =
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error';

      let responseBody = {
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      if (typeof exceptionResponse === 'string') {
        responseBody['error'] = exceptionResponse;
      }
      if (typeof exceptionResponse === 'object') {
        responseBody = { ...responseBody, ...exceptionResponse };
      }

      response.status(status).json(responseBody);
    } catch (filterError) {
      this.logger.error(
        'Exception filter failed while handling an exception',
        filterError instanceof Error ? filterError.stack : String(filterError),
      );
      this.logger.error(
        'Original exception that triggered the filter',
        exception instanceof Error ? exception.stack : String(exception),
      );
      try {
        const res = host.switchToHttp().getResponse<Response>();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      } catch {
        // Nothing more we can do
      }
    }
  }
}
