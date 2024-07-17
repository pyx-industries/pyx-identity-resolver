import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Exception filter that handles all exceptions thrown in the application.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

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
  }
}
