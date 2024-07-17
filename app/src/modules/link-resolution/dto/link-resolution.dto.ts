import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IdentifierParameterDto {
  @IsString()
  @IsNotEmpty()
  qualifier: string;

  @IsString()
  @IsNotEmpty()
  id: string;
}

export class IdentifierParamsDto {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => IdentifierParameterDto)
  primary: IdentifierParameterDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IdentifierParameterDto)
  secondaries?: IdentifierParameterDto[];
}

export class LinkResolutionDto {
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => IdentifierParamsDto)
  identifiers: IdentifierParamsDto;

  @IsObject()
  @IsOptional()
  descriptiveAttributes?: {
    [key: string]: any;
  };
}
