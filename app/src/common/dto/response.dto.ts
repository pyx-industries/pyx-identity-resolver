import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto {
  @ApiProperty({
    example: 'Application identifiers created successfully.',
    description: 'Response message',
  })
  message: string;
}
