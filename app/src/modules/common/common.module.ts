import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

@Module({
  imports: [ConfigModule],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
