import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * The function returns the health check status of the application.
   */
  @ApiOperation({ summary: 'Health check' })
  @ApiCreatedResponse({
    status: 200,
    description: 'Health check status',
    schema: {
      example: { status: 'OK' },
    },
  })
  @Get('health-check')
  @Public() // The decorator marks this route as public
  healthCheck() {
    return this.appService.healthCheck();
  }
}
