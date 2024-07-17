import { Module } from '@nestjs/common';
import { IdentifierManagementService } from './identifier-management.service';
import { IdentifierManagementController } from './identifier-management.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [IdentifierManagementService],
  controllers: [IdentifierManagementController],
  exports: [IdentifierManagementService],
})
export class IdentifierManagementModule {}
