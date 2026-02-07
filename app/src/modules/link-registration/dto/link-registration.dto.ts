import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import { mockMimeTypes } from '../constants/link-registration.constants';
import {
  EncryptionMethod,
  ENCRYPTION_METHODS,
  UntpAccessRole,
  UNTP_ACCESS_ROLES,
} from '../constants/untp-enums';

export class Response {
  @ApiProperty({
    description: 'Unique link identifier (server-generated, read-only)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    readOnly: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  linkId?: string;

  @ApiProperty({
    description: 'Default link type',
    example: true,
  })
  @IsBoolean()
  defaultLinkType: boolean;

  @ApiProperty({
    description: 'Default MIME type',
    example: true,
  })
  @IsBoolean()
  defaultMimeType: boolean;

  @ApiProperty({
    description: 'Default forward query string',
    example: false,
  })
  @IsBoolean()
  fwqs: boolean;

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    description: 'Link type',
    example: 'example-identifier-scheme:certificationInfo',
  })
  @IsString()
  linkType: string;

  @ApiProperty({
    description: 'Link title',
    example: 'Certification Information',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Target URL',
    example: 'https://example.com',
  })
  @IsString()
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  targetUrl: string;

  @ApiProperty({
    enum: mockMimeTypes,
    description: 'MIME type',
    example: 'application/json',
  })
  @IsString()
  @IsIn(mockMimeTypes)
  mimeType: string;

  @ApiProperty({
    description: 'IANA language',
    example: 'en',
  })
  @IsString()
  @IsNotEmpty()
  ianaLanguage: string;

  @ApiProperty({
    description: 'Context',
    example: 'au',
  })
  @IsString()
  @IsNotEmpty()
  context: string;

  @ApiProperty({
    description: 'Default context',
    example: true,
  })
  @IsBoolean()
  defaultContext: boolean;

  @ApiProperty({
    description: 'Default IANA language',
    example: true,
  })
  @IsBoolean()
  defaultIanaLanguage: boolean;

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

export class CreateLinkRegistrationDto {
  @ApiProperty({
    description: 'Namespace',
    example: 'example-identifier-scheme',
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: 'Identification key type',
    example: 'gtin',
  })
  @IsString()
  @IsNotEmpty()
  identificationKeyType: string;

  @ApiProperty({
    description: 'Identification key',
    example: '12345678901234',
  })
  @IsString()
  @IsNotEmpty()
  identificationKey: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Product description',
  })
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @ApiProperty({
    description: 'Qualifier path',
    example: '/10/12345678901234567890',
  })
  @IsString()
  @Matches(/^\/(\d+\/[\w\d]+(\/\d+\/[\w\d]+)*)?$/)
  qualifierPath: string = '/';

  @ApiProperty({
    description: 'Active status',
    example: true,
  })
  @IsBoolean()
  active: boolean;

  @ApiProperty({
    type: [Response],
    description: 'Response array',
    example: [
      {
        defaultLinkType: true,
        defaultMimeType: true,
        defaultIanaLanguage: true,
        defaultContext: true,
        fwqs: false,
        active: true,
        linkType: 'example-identifier-scheme:certificationInfo',
        ianaLanguage: 'en',
        context: 'au',
        title: 'Certification Information',
        targetUrl: 'https://example.com',
        mimeType: 'application/json',
        encryptionMethod: 'none',
        accessRole: ['untp:accessRole#Anonymous'],
        method: 'POST',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => Response)
  responses: Response[];
}
