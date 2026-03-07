import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CommonService } from './common.service';
import { ApiQuery } from '@nestjs/swagger';

@Controller()
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('.well-known/resolver')
  @Public()
  async getResolver() {
    const data = await this.commonService.transformResolverData();
    return data;
  }

  @Get('voc')
  @Public()
  @ApiQuery({
    name: 'show',
    required: false,
    description: 'Set to "linktypes" to retrieve link type vocabularies.',
    schema: {
      type: 'string',
      example: 'linktypes',
    },
  })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description:
      'Filter link types by vocabulary prefix (e.g. gs1, untp). Only applies when show=linktypes.',
    schema: {
      type: 'string',
      example: 'gs1',
    },
  })
  getVoc(
    @Query('show') show: string,
    @Query('prefix') prefix: string,
    @Res() res: Response,
  ) {
    if (show && show.toLowerCase() === 'linktypes') {
      return res.json(this.commonService.getLinkTypes(prefix));
    } else {
      return res.redirect('/voc/?show=linktypes');
    }
  }

  @Get('voc/:linktype')
  @Public()
  getLinkType(@Param('linktype') linktype: string, @Res() res: Response) {
    return res.json(this.commonService.getSpecificLinkType(linktype));
  }
}
