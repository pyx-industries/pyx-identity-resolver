import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LinkManagementService } from './link-management.service';
import { ListLinksQueryDto, UpdateLinkDto } from './dto/link-management.dto';
import { FieldErrorsResponse } from '../../common/dto/errors.dto';

@ApiTags('Link Management')
@Controller('resolver/links')
@ApiBearerAuth()
export class LinkManagementController {
  constructor(private readonly linkManagementService: LinkManagementService) {}

  @Get()
  @ApiOperation({ summary: 'List all active links for an identifier' })
  @ApiQuery({
    name: 'namespace',
    required: true,
    type: String,
    example: 'example-identifier-scheme',
  })
  @ApiQuery({
    name: 'identificationKeyType',
    required: true,
    type: String,
    example: 'gtin',
  })
  @ApiQuery({
    name: 'identificationKey',
    required: true,
    type: String,
    example: '12345678901234',
  })
  @ApiQuery({
    name: 'qualifierPath',
    required: false,
    type: String,
    example: '/10/12345678901234567890',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Links retrieved successfully',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request',
    type: FieldErrorsResponse,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Identifier document not found',
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async listLinks(@Query() query: ListLinksQueryDto) {
    return this.linkManagementService.listLinks(query);
  }

  @Get(':linkId')
  @ApiOperation({ summary: 'Get a specific link by linkId' })
  @ApiParam({
    name: 'linkId',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Link retrieved successfully',
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Link not found',
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async getLink(@Param('linkId') linkId: string) {
    return this.linkManagementService.getLink(linkId);
  }

  @Put(':linkId')
  @ApiOperation({ summary: 'Update a specific link' })
  @ApiParam({
    name: 'linkId',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiBody({ type: UpdateLinkDto })
  @ApiOkResponse({
    status: 200,
    description: 'Link updated successfully',
    schema: {
      example: { message: 'Link updated successfully' },
    },
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Bad Request',
    type: FieldErrorsResponse,
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Link not found',
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateLink(
    @Param('linkId') linkId: string,
    @Body() dto: UpdateLinkDto,
  ) {
    return this.linkManagementService.updateLink(linkId, dto);
  }

  @Delete(':linkId')
  @ApiOperation({
    summary: 'Delete a specific link (soft by default, hard with ?hard=true)',
  })
  @ApiParam({
    name: 'linkId',
    required: true,
    type: String,
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiQuery({
    name: 'hard',
    required: false,
    type: Boolean,
    description: 'Set to true for permanent deletion',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Link deleted successfully',
    schema: {
      example: { message: 'Link deleted successfully' },
    },
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Link not found',
  })
  @ApiInternalServerErrorResponse({
    status: 500,
    description: 'Internal Server Error',
  })
  async deleteLink(
    @Param('linkId') linkId: string,
    @Query('hard') hard?: string,
  ) {
    if (hard?.toLowerCase() === 'true' || hard === '1') {
      return this.linkManagementService.hardDeleteLink(linkId);
    }
    return this.linkManagementService.softDeleteLink(linkId);
  }
}
