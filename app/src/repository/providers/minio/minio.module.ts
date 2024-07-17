import { DynamicModule, Module } from '@nestjs/common';
import * as Minio from 'minio';
import { RepositoryModuleOptions } from '../../interfaces/repository-options.interface';
import { REPOSITORY_MODULE_OPTIONS } from '../../repository.constants';
import { getRepositoryToken } from '../../repository.utils';
import { MinioProvider } from './minio.provider';

@Module({})
export class MinioModule {
  static forRoot(options?: RepositoryModuleOptions): DynamicModule {
    const repositoryModuleOptions = {
      provide: REPOSITORY_MODULE_OPTIONS,
      useValue: options,
    };

    const dataSourceProvider = {
      provide: getRepositoryToken('Minio'),
      useFactory: async () => await this.createDataSourceFactory(options),
    };

    const providers = [
      repositoryModuleOptions,
      dataSourceProvider,
      MinioProvider,
    ];
    return {
      module: MinioModule,
      providers,
      exports: [MinioProvider],
    };
  }

  private static async createDataSourceFactory(
    options: RepositoryModuleOptions,
  ) {
    const minioClient = new Minio.Client({
      region: options.region,
      endPoint: options.endPoint,
      port: options.port,
      useSSL: options.useSSL,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      pathStyle: options.pathStyle,
    });
    const exists = await minioClient.bucketExists(options.bucket);

    if (!exists) {
      await minioClient.makeBucket(options.bucket, options.region);
    }

    return minioClient;
  }
}
