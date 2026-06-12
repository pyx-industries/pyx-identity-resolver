import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { buildLoggerParams } from './logging.config';

/**
 * Registers nestjs-pino app-wide. `LoggerModule.forRoot` is global, so importing
 * this module once makes `Logger` and `PinoLogger` injectable everywhere.
 */
@Module({
  imports: [LoggerModule.forRoot(buildLoggerParams())],
  exports: [LoggerModule],
})
export class LoggingModule {}
