import { Module } from '@nestjs/common';
import { LinkResolutionService } from './link-resolution.service';
import { LinkResolutionController } from './link-resolution.controller';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';

@Module({
  imports: [IdentifierManagementModule],
  controllers: [LinkResolutionController],
  providers: [LinkResolutionService],
})
export class LinkResolutionModule {}
