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
    description:
      'The namespace of the identifier to retrieve. If not provided, all identifiers are returned.',
    schema: {
      type: 'string',
      example: 'linktypes',
    },
  })
  getVoc(@Query('show') show: string, @Res() res: Response) {
    if (show && show.toLowerCase() === 'linktypes') {
      return res.json(this.commonService.getLinkTypes());
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
