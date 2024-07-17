import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { IdentifierManagementModule } from '../identifier-management/identifier-management.module';

@Module({
  imports: [ConfigModule, IdentifierManagementModule],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
