import { ClientOptions } from 'minio';
export type MinioOptions = { name: string; bucket: string } & ClientOptions;
