import { HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * ApiResponse decorator for server errors.
 * This decorator specifies the response schema and description for an
 * internal server error.
 */
export const ServerErrorResponse = ApiResponse({
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  description: 'Internal Server Error',
  schema: {
    example: {
      message: 'Internal server error',
    },
  },
});
