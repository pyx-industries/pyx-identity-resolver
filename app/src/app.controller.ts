import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Example of a public route
   */
  @Get()
  @Public() // The decorator marks this route as public
  getHello(): string {
    return this.appService.getHello();
  }
}
