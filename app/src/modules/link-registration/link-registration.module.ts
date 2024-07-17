import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LinkRegistrationController } from './link-registration.controller';
import { LinkRegistrationService } from './link-registration.service';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';

@Module({
  controllers: [LinkRegistrationController],
  providers: [LinkRegistrationService],
  imports: [ConfigModule, IdentifierManagementModule, HttpModule],
})
export class LinkRegistrationModule {}
