import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

export const BCP_47_HREFLANG_REGEX = /(^\w{2}$)|(^\w{2}-\w{2}$)/;

const HREFLANG_DESCRIPTION = 'The human language(s) of the target resource.';
const HREFLANG_QUERY_DESCRIPTION =
  'Filter responses whose `hreflang[]` contains the supplied BCP 47 tag.';

const ITEM_VALIDATION_MESSAGE =
  'each item in hreflang must be a BCP 47 language tag (e.g. `en`, `en-US`)';
const QUERY_VALIDATION_MESSAGE =
  'hreflang must be a BCP 47 language tag (e.g. `en`, `en-US`)';

/**
 * Decorates the optional `hreflang: string[]` field on link target DTOs.
 * Bundles the OpenAPI metadata, the array-of-strings validator, and a
 * per-item BCP 47 pattern check matching the UNTP LinksetSchema regex.
 *
 * @see https://untp.unece.org/docs/specification/IdentityResolver UNTP Identity Resolver LinksetSchema (`hreflang`)
 * @see https://www.rfc-editor.org/rfc/rfc9264 RFC 9264 Linkset (target attribute format)
 */
export const HreflangProperty = () =>
  applyDecorators(
    ApiPropertyOptional({
      description: HREFLANG_DESCRIPTION,
      example: ['en'],
      type: [String],
      pattern: BCP_47_HREFLANG_REGEX.source,
    }),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    Matches(BCP_47_HREFLANG_REGEX, {
      each: true,
      message: ITEM_VALIDATION_MESSAGE,
    }),
  );

/**
 * Decorates the optional single-value `hreflang` query parameter used by
 * link management list endpoints. Reuses the same BCP 47 pattern as
 * {@link HreflangProperty} so registration and filtering accept the same
 * tag shapes.
 */
export const HreflangQueryProperty = () =>
  applyDecorators(
    ApiPropertyOptional({
      description: HREFLANG_QUERY_DESCRIPTION,
      example: 'en',
      pattern: BCP_47_HREFLANG_REGEX.source,
    }),
    IsOptional(),
    IsString(),
    Matches(BCP_47_HREFLANG_REGEX, { message: QUERY_VALIDATION_MESSAGE }),
  );
