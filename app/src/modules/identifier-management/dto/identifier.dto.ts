import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ApplicationIdentifier {
  @ApiProperty({
    description: 'The title of the application identifier',
    example: 'Global Trade Item Number (GTIN)',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The label of the application identifier',
    example: 'GTIN',
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    description: 'The shortcode of the application identifier',
    example: 'gtin',
  })
  @IsString()
  @IsNotEmpty()
  shortcode: string;

  @ApiProperty({
    description: 'The application identifier (AI)',
    example: '01',
  })
  @IsNotEmpty()
  @IsString()
  ai: string;

  @ApiProperty({
    description:
      'The type of the application identifier, must be one of I, Q, D',
    example: 'I',
  })
  @IsString()
  @IsIn(['I', 'Q', 'D'])
  type: string;

  @ApiProperty({
    description:
      'The regular expression pattern for the application identifier',
    example: '\\d{12,14}|\\d{8}',
  })
  @IsString()
  @IsNotEmpty()
  regex: string;

  @ApiProperty({
    description: 'The format of the application identifier',
    example: 'X..20',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  format?: string;

  @ApiProperty({
    description: 'A list of qualifier AIs related to the primary AI',
    example: ['22', '10', '21'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  qualifiers?: string[];
}

export class NamespaceDto {
  @ApiProperty({
    description: 'The namespace of the identifier',
    example: 'gs1',
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: 'The namespace URI of the identifier',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  namespaceURI?: string;

  @ApiProperty({
    description: 'The namespace profile of the identifier',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  namespaceProfile?: string;
}

export class IdentifierDto extends NamespaceDto {
  @ApiProperty({
    description: 'A list of application identifiers',
    type: [ApplicationIdentifier],
    example: [
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
        title: 'Batch or lot number',
        label: 'BATCH/LOT',
        shortcode: 'lot',
        ai: '10',
        type: 'Q',
        regex:
          '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationIdentifier)
  applicationIdentifiers: ApplicationIdentifier[];
}
