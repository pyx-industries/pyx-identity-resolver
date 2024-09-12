import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { LinkResolutionService } from './link-resolution.service';
import { IdentifierParams } from './decorators/identifier-params.decorator';
import { LinkResolutionDto } from './dto/link-resolution.dto';
import { responseResolvedLink } from './utils/response-link.utils';
import {
  ApiBadRequestResponse,
  ApiExcludeEndpoint,
  ApiFoundResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FieldErrorsResponse } from '../../common/dto/errors.dto';
import { IdentifierSetValidationPipe } from '../identifier-management/pipes/identifier-set-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class LinkResolutionController {
  constructor(private readonly linkResolutionService: LinkResolutionService) {}

  @Get([
    ':namespace/:identifierKeyType/:identifierKey/:secondaryIdentifiersPath?',
  ])
  @ApiOperation({ summary: 'Resolve a link resolver for an identifier' })
  @ApiTags('Link Resolution')
  @ApiParam({
    type: String,
    name: 'namespace',
    description: 'Namespace',
    example: 'gs1',
  })
  @ApiParam({
    type: String,
    name: 'identifierKeyType',
    description: 'Identifier key type',
    example: '01',
  })
  @ApiParam({
    type: String,
    name: 'identifierKey',
    description: 'Identifier key',
    example: '12345678901234',
  })
  @ApiParam({
    type: String,
    name: 'secondaryIdentifiersPath',
    required: false,
    allowEmptyValue: true,
    description: 'Secondary identifiers path',
    example: '10/12345678901234567890',
  })
  @ApiQuery({
    name: 'linkType',
    type: String,
    required: false,
    description: 'Link type',
    example: 'all',
  })
  @ApiFoundResponse({
    description: 'Redirect to the resolved link',
  })
  @ApiNotFoundResponse({
    description: 'Link could not be resolved',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request parameters',
    type: FieldErrorsResponse,
  })
  @Public()
  // The `resolveClone` method is clone of the `resolve` method to handle the Swagger API documentation, because it is not supporting the wildcard path
  async resolveClone(
    @IdentifierParams('identifierParams', IdentifierSetValidationPipe)
    identifierParams: LinkResolutionDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const resolvedLink =
      await this.linkResolutionService.resolve(identifierParams);

    responseResolvedLink(res, req, resolvedLink);
  }

  @Get([
    ':namespace/:identifierKeyType/:identifierKey',
    ':namespace/:identifierKeyType/:identifierKey/*',
  ])
  @ApiExcludeEndpoint()
  @Public()
  async resolve(
    @IdentifierParams('identifierParams', IdentifierSetValidationPipe)
    identifierParams: LinkResolutionDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const resolvedLink =
      await this.linkResolutionService.resolve(identifierParams);

    responseResolvedLink(res, req, resolvedLink);
  }
}
