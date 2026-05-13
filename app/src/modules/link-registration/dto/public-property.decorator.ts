import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

const PUBLIC_DESCRIPTION =
  'Whether the URL itself is safe to publish in a public directory. ' +
  'Distinct from `accessRole` and `encryptionMethod`, which govern who ' +
  'may retrieve or decrypt the resource at that URL. A link may be ' +
  '`public: true` while still requiring an authorised role to fetch ' +
  'the content.';

/**
 * Decorates the optional `public: boolean` field on link target DTOs.
 * Bundles the OpenAPI metadata and the boolean validator so the
 * description and example stay consistent across every DTO that
 * exposes the field.
 */
export const PublicProperty = () =>
  applyDecorators(
    ApiPropertyOptional({
      description: PUBLIC_DESCRIPTION,
      example: true,
    }),
    IsOptional(),
    IsBoolean(),
  );
