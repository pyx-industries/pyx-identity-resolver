import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateLinkRegistrationDto } from './dto/link-registration.dto';
import { LinkRegistrationService } from './link-registration.service';
import { IdentifierSetValidationPipe } from '../identifier-management/pipes/identifier-set-validation.pipe';
import { ISO639ValidationPipe } from './pipes/iso639-validation.pipe';
import { FieldErrorsResponse } from '../../common/dto/errors.dto';
import { Bcp47ValidationPipe } from './pipes/bcp47-validation.pipe';
import { LinkRegistrationTransformPipe } from './pipes/link-registration-transform.pipe';
import { ValidateLinkTypePipe } from './pipes/validate-link-type.pipe';

@ApiTags('Link Registration')
@Controller('api/resolver')
@ApiBearerAuth()
export class LinkRegistrationController {
  constructor(private linkRegistrationService: LinkRegistrationService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new link resolver' })
  @ApiBody({ type: CreateLinkRegistrationDto })
  @ApiCreatedResponse({
    status: 201,
    description: 'Link resolver registered successfully',
    schema: {
      example: { message: 'Link resolver registered successfully' },
    },
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request',
    type: FieldErrorsResponse,
  })
  @ApiUnprocessableEntityResponse({
    status: 422,
    description: 'Unprocessable Entity',
    type: FieldErrorsResponse,
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Internal Server Error',
    type: ApiInternalServerErrorResponse,
  })
  @UsePipes(
    new ValidationPipe({ whitelist: true }), // ignore extra fields
    IdentifierSetValidationPipe,
    ISO639ValidationPipe,
    Bcp47ValidationPipe,
    LinkRegistrationTransformPipe,
    ValidateLinkTypePipe,
  )
  async create(@Body() createLinkRegistrationDto: CreateLinkRegistrationDto) {
    return await this.linkRegistrationService.create(createLinkRegistrationDto);
  }
}
