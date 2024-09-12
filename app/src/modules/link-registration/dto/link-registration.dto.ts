import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  ValidateNested,
} from 'class-validator';
import {
  mockLinkTypes,
  mockMimeTypes,
} from '../constants/link-registration.constants';

export class Response {
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
    description: 'Default forwared query string',
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
    enum: mockLinkTypes,
    description: 'Link type',
    example: 'gs1:certificationInfo',
  })
  @IsString()
  @IsIn(mockLinkTypes)
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
}

export class CreateLinkRegistrationDto {
  @ApiProperty({
    description: 'Namespace',
    example: 'gs1',
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
        linkType: 'gs1:certificationInfo',
        ianaLanguage: 'en',
        context: 'au',
        title: 'Certification Information',
        targetUrl: 'https://example.com',
        mimeType: 'application/json',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => Response)
  responses: Response[];
}
