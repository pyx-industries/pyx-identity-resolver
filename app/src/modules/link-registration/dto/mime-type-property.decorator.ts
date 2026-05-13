import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { MIME_TYPE_REGEX } from '../constants/mime-type';

const MIME_TYPE_OPENAPI_BASE = {
  type: String,
  pattern: MIME_TYPE_REGEX.source,
  example: 'application/vc+ld+json',
};

const MIME_TYPE_VALIDATION_MESSAGE =
  '$property must be a well-formed MIME type per RFC 6838';

/**
 * Decorates a required MIME type DTO field. Bundles the OpenAPI schema
 * (string with the shared MIME type pattern), the validator
 * (`@Matches(MIME_TYPE_REGEX)`), and the human-readable description
 * suffix into a single decorator.
 *
 * @param description Field-specific lead-in text, e.g. "MIME type of the target resource."
 */
export const MimeTypeProperty = (description: string) =>
  applyDecorators(
    ApiProperty({
      ...MIME_TYPE_OPENAPI_BASE,
      description: `${description} Any well-formed \`type/subtype\` string per RFC 6838.`,
    }),
    IsString(),
    Matches(MIME_TYPE_REGEX, { message: MIME_TYPE_VALIDATION_MESSAGE }),
  );

/**
 * Optional counterpart of {@link MimeTypeProperty}. Adds `@IsOptional()`
 * and emits `@ApiPropertyOptional` so the field is documented as
 * non-required.
 *
 * @param description Field-specific lead-in text.
 * @param options.default Optional default value to surface in the OpenAPI doc.
 */
export const OptionalMimeTypeProperty = (
  description: string,
  options: { default?: string } = {},
) =>
  applyDecorators(
    ApiPropertyOptional({
      ...MIME_TYPE_OPENAPI_BASE,
      description: `${description} Any well-formed \`type/subtype\` string per RFC 6838.`,
      ...(options.default !== undefined ? { default: options.default } : {}),
    }),
    IsOptional(),
    IsString(),
    Matches(MIME_TYPE_REGEX, { message: MIME_TYPE_VALIDATION_MESSAGE }),
  );
