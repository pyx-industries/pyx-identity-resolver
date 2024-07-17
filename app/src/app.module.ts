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
import { CommonModule } from './modules/common/common.module';
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
      region: process.env.OBJECT_STORAGE_REGION,
      endPoint: process.env.OBJECT_STORAGE_ENDPOINT,
      port: +process.env.OBJECT_STORAGE_PORT,
      useSSL: process.env.OBJECT_STORAGE_USE_SSL === 'true',
      accessKey: process.env.OBJECT_STORAGE_ACCESS_KEY,
      secretKey: process.env.OBJECT_STORAGE_SECRET_KEY,
      bucket: process.env.OBJECT_STORAGE_BUCKET_NAME,
      pathStyle: process.env.OBJECT_STORAGE_PATH_STYLE === 'true',
    }),
    I18nModule.forRoot(i18nConfig),
    SharedModule,
    IdentifierManagementModule,
    LinkRegistrationModule,
    LinkResolutionModule,
    AuthModule,
    CommonModule,
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
