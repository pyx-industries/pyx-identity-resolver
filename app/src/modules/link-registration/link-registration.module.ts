import { Module } from '@nestjs/common';
import { LinkRegistrationController } from './link-registration.controller';
import { LinkRegistrationService } from './link-registration.service';
import { ConfigModule } from '@nestjs/config';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';

@Module({
  controllers: [LinkRegistrationController],
  providers: [LinkRegistrationService],
  imports: [ConfigModule, IdentifierManagementModule],
})
export class LinkRegistrationModule {}
