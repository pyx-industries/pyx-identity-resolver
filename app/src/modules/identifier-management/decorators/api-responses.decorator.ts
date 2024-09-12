import { HttpStatus } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { IdentifierDto } from '../dto/identifier.dto';

/**
 * ApiBody decorator for the IdentifierDto
 * This decorator specifies that the request body for the API endpoint
 * should be of type IdentifierDto.
 */
export const IdentifierApiBody = ApiBody({ type: IdentifierDto });

/**
 * ApiResponse decorator for a successful creation/update of identifier.
 * This decorator specifies the response schema and description for a
 * successful creation or update operation.
 */
export const CreatedResponse = ApiResponse({
  status: HttpStatus.OK,
  description: 'Identifier created/updated successfully.',
  schema: {
    example: { message: 'Application identifier upserted successfully' },
  },
});

/**
 * ApiResponse decorator for a successful deletion of identifier.
 * This decorator specifies the response schema and description for a
 * successful deletion operation.
 */
export const DeletedResponse = ApiResponse({
  status: HttpStatus.OK,
  description: 'Identifier deleted successfully.',
  schema: {
    example: { message: 'Application identifier deleted successfully' },
  },
});

/**
 * ApiResponse decorator for validation errors.
 * This decorator specifies the response schema and description for
 * a bad request due to validation errors.
 */
export const ValidationErrorResponse = ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Bad Request',
  schema: {
    example: {
      errors: [
        {
          field: 'applicationIdentifiers.0.shortcode',
          message: 'shortcode must be a string',
        },
        {
          field: 'applicationIdentifiers.0.regex',
          message: 'regex must be a string',
        },
      ],
    },
  },
});

/**
 * ApiResponse decorator for missing namespace query parameter.
 * This decorator specifies the response schema and description for
 * a bad request when the namespace query parameter is required but missing or invalid.
 */
export const MissingNamespaceErrorResponse = ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: 'Bad Request - Validation Error',
  schema: {
    example: {
      error: 'Namespace is required',
    },
  },
});

/**
 * ApiResponse decorator for a successful retrieval of identifiers.
 * This decorator specifies the response schema and description for a
 * successful retrieval operation.
 */
export const GetIdentifierResponse = ApiResponse({
  status: HttpStatus.OK,
  description: 'Identifiers retrieved successfully.',
  content: {
    'application/json': {
      schema: {
        oneOf: [
          { $ref: '#/components/schemas/IdentifierDto' },
          {
            type: 'array',
            items: { $ref: '#/components/schemas/IdentifierDto' },
          },
        ],
      },
      examples: {
        oneNamespace: {
          summary: 'Single Namespace Response',
          value: {
            namespace: 'gs1',
            applicationIdentifiers: [
              {
                title: 'Global Trade Item Number (GTIN)',
                label: 'GTIN',
                shortcode: 'gtin',
                ai: '01',
                type: 'I',
                qualifiers: ['10'],
                regex: '(\\d{12,14}|\\d{8})',
              },
              {
                title: 'Batch or Lot Number',
                label: 'BATCH/LOT',
                shortcode: 'lot',
                ai: '10',
                type: 'Q',
                regex:
                  '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
              },
            ],
          },
        },
        allNamespaces: {
          summary: 'All Namespaces Response',
          value: [
            {
              namespace: 'gs1',
              applicationIdentifiers: [
                {
                  title: 'Global Trade Item Number (GTIN)',
                  label: 'GTIN',
                  shortcode: 'gtin',
                  ai: '01',
                  type: 'I',
                  regex: '(\\d{12,14}|\\d{8})',
                },
              ],
            },
            {
              namespace: 'integrity-systems',
              applicationIdentifiers: [
                {
                  title: 'NLIS ID',
                  label: 'NLISID',
                  shortcode: 'nlisid',
                  ai: '01',
                  format: 'N14',
                  type: 'I',
                  regex: '(\\d{12,14}|\\d{8})',
                },
              ],
            },
          ],
        },
      },
    },
  },
});

/**
 * ApiQuery decorator for the required 'namespace' query parameter.
 * This decorator specifies that the 'namespace' query parameter is required
 * and provides a description for the parameter.
 */
export const NamespaceQueryDelete = ApiQuery({
  name: 'namespace',
  required: true,
  description: 'The namespace of the identifier to delete',
  schema: {
    type: 'string',
    example: 'example-namespace',
  },
});

/**
 * ApiQuery decorator for the 'namespace' query parameter.
 * This decorator specifies that the 'namespace' query parameter is optional
 * and provides a description for the parameter.
 */
export const NamespaceQueryGet = ApiQuery({
  name: 'namespace',
  required: false,
  description:
    'The namespace of the identifier to retrieve. If not provided, all identifiers are returned.',
  schema: {
    type: 'string',
    example: 'example-namespace',
  },
});
