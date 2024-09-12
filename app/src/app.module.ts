import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RepositoryModule } from './repository/repository.module';
import { RepositoryProvider } from './repository/interfaces/repository-options.interface';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from 'nestjs-i18n';
import { i18nConfig } from './i18n/i18n.config';
import { IdentifierManagementModule } from './modules/identifier-management/identifier-management.module';
import { LinkRegistrationModule } from './modules/link-registration/link-registration.module';
import { LinkResolutionModule } from './modules/link-resolution/link-resolution.module';
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { CustomAuthGuard } from './common/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
      ],
    }),
    RepositoryModule.forRoot({
      provider: RepositoryProvider.Minio,
      endPoint: process.env.MINIO_ENDPOINT,
      port: +process.env.MINIO_PORT,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      bucket: process.env.MINIO_BUCKET_NAME,
    }),
    I18nModule.forRoot(i18nConfig),
    SharedModule,
    IdentifierManagementModule,
    LinkRegistrationModule,
    LinkResolutionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomAuthGuard,
    },
  ],
  exports: [],
})
export class AppModule {}
