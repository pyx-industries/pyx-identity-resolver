import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Delete,
  HttpCode,
  UsePipes,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { IdentifierManagementService } from './identifier-management.service';
import { IdentifierDto } from './dto/identifier.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreatedResponse,
  DeletedResponse,
  GetIdentifierResponse,
  IdentifierApiBody,
  MissingNamespaceErrorResponse,
  NamespaceQueryDelete,
  NamespaceQueryGet,
  ValidationErrorResponse,
} from './decorators/api-responses.decorator';
import { ServerErrorResponse } from '../../common/decorators/api-responses.decorator';
import { I18nService } from 'nestjs-i18n';
import { ResponseDto } from '../../common/dto/response.dto';
import { IdentifierExistencePipe } from './pipes/identifier-existence.pipe';
import { IdentifierValidationPipe } from './pipes/identifier-validation.pipe';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';
import { IdentifierTransformPipe } from './pipes/identifier-transform.pipe';

@ApiTags('Identifiers')
@Controller('api/identifiers')
@ApiBearerAuth()
export class IdentifierManagementController {
  constructor(
    private readonly identifierManagementService: IdentifierManagementService,
    private readonly i18n: I18nService,
  ) {}

  @ApiOperation({ summary: 'Create or update identifier' })
  @CreatedResponse
  @ValidationErrorResponse
  @ServerErrorResponse
  @IdentifierApiBody
  @Post()
  @UsePipes(
    new ValidationPipe({ whitelist: true }), // ignore extra fields
    IdentifierTransformPipe,
    IdentifierValidationPipe,
  )
  @HttpCode(200)
  async upsertIdentifier(
    @Body() identifierDto: IdentifierDto,
  ): Promise<ResponseDto> {
    await this.identifierManagementService.upsertIdentifier(identifierDto);

    const message = this.i18n.translate('successes.identifiers_created');
    return { message };
  }

  @ApiOperation({ summary: 'Delete identifier by namespace' })
  @NamespaceQueryDelete
  @DeletedResponse
  @ServerErrorResponse
  @MissingNamespaceErrorResponse
  @Delete()
  @UsePipes(IdentifierExistencePipe)
  async deleteIdentifier(
    @Query('namespace') namespace: string,
  ): Promise<ResponseDto> {
    // Currently only one namespace can be deleted at a time so namespace must be provided
    if (!namespace) {
      throw new GeneralErrorException(this.i18n, HttpStatus.BAD_REQUEST, {
        key: 'missing_namespace',
      });
    }

    await this.identifierManagementService.deleteIdentifier(namespace);
    const message = this.i18n.translate('successes.identifiers_deleted');
    return { message };
  }

  @ApiOperation({ summary: 'Get identifier by namespace' })
  @NamespaceQueryGet
  @GetIdentifierResponse
  @ServerErrorResponse
  @Get()
  @UsePipes(IdentifierExistencePipe)
  async getIdentifier(
    @Query('namespace') namespace: string,
  ): Promise<IdentifierDto | IdentifierDto[]> {
    if (namespace) {
      return this.identifierManagementService.getIdentifier(namespace);
    }
    return this.identifierManagementService.getIdentifiers();
  }
}
