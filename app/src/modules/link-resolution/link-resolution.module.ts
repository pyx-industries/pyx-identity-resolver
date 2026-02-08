import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkResolutionService } from './link-resolution.service';
import { LinkResolutionController } from './link-resolution.controller';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';

@Module({
  imports: [ConfigModule, IdentifierManagementModule],
  controllers: [LinkResolutionController],
  providers: [LinkResolutionService],
})
export class LinkResolutionModule {}
