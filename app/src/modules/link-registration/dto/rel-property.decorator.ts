import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

/**
 * Link relation values the server emits itself and reserves from
 * publisher input. Publisher-set rel arrays are filtered to strip
 * these values so server semantics cannot be overwritten or forged
 * via the input path.
 */
const SERVER_RESERVED_REL_VALUES: ReadonlyArray<string> = [
  'predecessor-version',
];

const REL_DESCRIPTION =
  'Additional link relation types qualifying this link beyond its ' +
  'primary linkType (e.g. `edit`, `latest-version`). Treated as ' +
  'opaque strings; values are not validated against the IANA link ' +
  'relation registry. Server-reserved values (`predecessor-version`) ' +
  'are silently stripped from the input.';

/**
 * Decorates the optional `rel: string[]` field on link target DTOs.
 * Bundles the OpenAPI metadata, the array-of-strings validator, and
 * a `@Transform` that strips server-reserved rel values so the
 * description, example, and filtering rule stay consistent across
 * every DTO that exposes the field.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8288 RFC 8288 Web Linking (defines `rel`)
 * @see https://www.rfc-editor.org/rfc/rfc9264 RFC 9264 Linkset (defines the linkset target format)
 */
export const RelProperty = () =>
  applyDecorators(
    ApiPropertyOptional({
      description: REL_DESCRIPTION,
      example: ['edit'],
      type: [String],
    }),
    Transform(({ value }) =>
      Array.isArray(value)
        ? value.filter((v) => !SERVER_RESERVED_REL_VALUES.includes(v))
        : value,
    ),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
  );
