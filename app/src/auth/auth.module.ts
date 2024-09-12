import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyStrategy } from './strategies/api-key.strategy';
import { AuthStrategy } from './interfaces/auth.interface';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: AuthStrategy.API_KEY }),
  ],
  providers: [ApiKeyStrategy],
  exports: [PassportModule, ApiKeyStrategy],
})
export class AuthModule {}
