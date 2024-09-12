import { MinioOptions } from '../providers/minio/minio.interface';

export enum RepositoryProvider {
  Minio = 'minio',
}

export type RepositoryModuleOptions = {
  provider: RepositoryProvider;
} & Partial<Omit<MinioOptions, 'name'>>;
