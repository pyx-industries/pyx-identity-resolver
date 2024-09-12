import { ApiProperty } from '@nestjs/swagger';

export type ErrorProperties = {
  key: string;
  args?: Record<string, any>;
};

export class FieldError {
  @ApiProperty({ example: 'identificationKeyType' })
  field: string;

  @ApiProperty({
    example:
      "Identification key type 'invalid_key_type' is not registered with the namespace 'gs1'",
  })
  message?: string;

  errorProperties: ErrorProperties;
}

export class FieldErrorsResponse {
  @ApiProperty({ type: [FieldError] })
  errors: FieldError[];
}

export class GeneralErrorResponse {
  @ApiProperty({ example: 'Cannot resolve link resolver' })
  error: string;
}
