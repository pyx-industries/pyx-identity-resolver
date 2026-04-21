import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LinkRegistrationController } from './link-registration.controller';
import { LinkRegistrationService } from './link-registration.service';
import { LinkManagementController } from './link-management.controller';
import { LinkManagementService } from './link-management.service';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';
import { ItemDescriptionNormalisationMiddleware } from './middleware/item-description-normalisation.middleware';

@Module({
  controllers: [LinkRegistrationController, LinkManagementController],
  providers: [LinkRegistrationService, LinkManagementService],
  imports: [ConfigModule, IdentifierManagementModule, HttpModule],
})
export class LinkRegistrationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ItemDescriptionNormalisationMiddleware)
      .forRoutes({ path: 'resolver', method: RequestMethod.POST });
  }
}
