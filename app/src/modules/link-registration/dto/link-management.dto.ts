import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { mockMimeTypes } from '../constants/link-registration.constants';
import {
  EncryptionMethod,
  ENCRYPTION_METHODS,
  UntpAccessRole,
  UNTP_ACCESS_ROLES,
} from '../constants/untp-enums';

/**
 * Query DTO for listing all links for an identifier.
 * Used on GET /resolver/links?namespace=&identificationKeyType=&identificationKey=&qualifierPath=
 */
export class ListLinksQueryDto {
  @ApiProperty({
    description: 'The namespace of the identifier scheme',
    example: 'example-identifier-scheme',
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: 'The identification key type',
    example: 'gtin',
  })
  @IsString()
  @IsNotEmpty()
  identificationKeyType: string;

  @ApiProperty({
    description: 'The identification key value',
    example: '12345678901234',
  })
  @IsString()
  @IsNotEmpty()
  identificationKey: string;

  @ApiPropertyOptional({
    description: 'The qualifier path',
    example: '/10/12345678901234567890',
    default: '/',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\/(\d+\/[\w\d]+(\/\d+\/[\w\d]+)*)?$/, {
    message:
      'qualifierPath must match the pattern /aiCode/value or /aiCode/value/aiCode/value...',
  })
  qualifierPath?: string = '/';

  @ApiPropertyOptional({
    description: 'Filter responses by link type',
    example: 'example-identifier-scheme:certificationInfo',
  })
  @IsOptional()
  @IsString()
  linkType?: string;

  @ApiPropertyOptional({
    description: 'Filter responses by MIME type',
    example: 'application/json',
  })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Filter responses by IANA language tag',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  ianaLanguage?: string;
}

/**
 * DTO for a single link response within add/update operations.
 */
export class LinkResponseDto {
  @ApiProperty({
    description: 'The target URL for this link',
    example: 'https://example.com',
  })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  targetUrl: string;

  @ApiProperty({
    description: 'The link type',
    example: 'example-identifier-scheme:certificationInfo',
  })
  @IsString()
  @IsNotEmpty()
  linkType: string;

  @ApiProperty({
    description: 'The title of the link',
    example: 'Certification Information',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    enum: mockMimeTypes,
    description: 'The MIME type',
    example: 'application/json',
    default: 'text/html',
  })
  @IsOptional()
  @IsString()
  @IsIn(mockMimeTypes)
  mimeType?: string = 'text/html';

  @ApiPropertyOptional({
    description: 'The IANA language tag',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  ianaLanguage?: string = 'en';

  @ApiPropertyOptional({
    description: 'The context code',
    example: 'au',
    default: 'us',
  })
  @IsOptional()
  @IsString()
  context?: string = 'us';

  @ApiPropertyOptional({
    description: 'Whether this link is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether to forward query string to target URL',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  fwqs?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this is the default link type',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  defaultLinkType?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this is the default IANA language',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  defaultIanaLanguage?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this is the default context',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  defaultContext?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this is the default MIME type',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  defaultMimeType?: boolean = false;

  @ApiPropertyOptional({
    description:
      'Encryption method applied to the target resource (UNTP IDR-10)',
    enum: ENCRYPTION_METHODS,
    example: EncryptionMethod.None,
  })
  @IsOptional()
  @IsString()
  @IsIn(ENCRYPTION_METHODS)
  encryptionMethod?: EncryptionMethod;

  @ApiPropertyOptional({
    description: 'UNTP access roles that may retrieve this link variant',
    enum: UNTP_ACCESS_ROLES,
    example: [UntpAccessRole.Anonymous],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(UNTP_ACCESS_ROLES, { each: true })
  accessRole?: UntpAccessRole[];

  @ApiPropertyOptional({
    description: 'HTTP method for accessing the target (UNTP IDR-10)',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  method?: string;
}

/**
 * DTO for updating a specific link by linkId.
 * All fields are optional — only provided fields are updated.
 * Used on PUT /resolver/links/:linkId
 */
export class UpdateLinkDto {
  @ApiPropertyOptional({
    description: 'New target URL',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  targetUrl?: string;

  @ApiPropertyOptional({
    description: 'New link type',
    example: 'example-identifier-scheme:certificationInfo',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  linkType?: string;

  @ApiPropertyOptional({
    description: 'New title',
    example: 'Certification Information',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    enum: mockMimeTypes,
    description: 'New MIME type',
    example: 'application/json',
  })
  @IsOptional()
  @IsString()
  @IsIn(mockMimeTypes)
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'New IANA language tag',
    example: 'en',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  ianaLanguage?: string;

  @ApiPropertyOptional({
    description: 'New context code',
    example: 'au',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Whether this link is active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Whether to forward query string' })
  @IsOptional()
  @IsBoolean()
  fwqs?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is the default link type' })
  @IsOptional()
  @IsBoolean()
  defaultLinkType?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is the default IANA language',
  })
  @IsOptional()
  @IsBoolean()
  defaultIanaLanguage?: boolean;

  @ApiPropertyOptional({ description: 'Whether this is the default context' })
  @IsOptional()
  @IsBoolean()
  defaultContext?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is the default MIME type',
  })
  @IsOptional()
  @IsBoolean()
  defaultMimeType?: boolean;

  @ApiPropertyOptional({
    description:
      'Encryption method applied to the target resource (UNTP IDR-10)',
    enum: ENCRYPTION_METHODS,
    example: EncryptionMethod.None,
  })
  @IsOptional()
  @IsString()
  @IsIn(ENCRYPTION_METHODS)
  encryptionMethod?: EncryptionMethod;

  @ApiPropertyOptional({
    description: 'UNTP access roles that may retrieve this link variant',
    enum: UNTP_ACCESS_ROLES,
    example: [UntpAccessRole.Anonymous],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(UNTP_ACCESS_ROLES, { each: true })
  accessRole?: UntpAccessRole[];

  @ApiPropertyOptional({
    description: 'HTTP method for accessing the target (UNTP IDR-10)',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  method?: string;
}
