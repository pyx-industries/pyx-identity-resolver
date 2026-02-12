import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { InjectRepository } from '../../repository.decorators';
import { REPOSITORY_MODULE_OPTIONS } from '../../repository.constants';
import { RepositoryModuleOptions } from '../../interfaces/repository-options.interface';
import {
  IRepositoryProvider,
  SaveParams,
} from '../provider.repository.interface';

@Injectable()
export class MinioProvider implements IRepositoryProvider {
  private readonly logger = new Logger(MinioProvider.name);

  constructor(
    @InjectRepository('Minio')
    private minioClient: Minio.Client,
    @Inject(REPOSITORY_MODULE_OPTIONS)
    private options: RepositoryModuleOptions,
  ) {}

  async save(data: SaveParams): Promise<void> {
    const metaData = {
      'Content-Type': 'application/json',
    };
    const id = data.id.endsWith('.json') ? data.id : `${data.id}.json`;
    const stringifiedData = JSON.stringify(data);

    try {
      await this.minioClient.putObject(
        this.options.bucket,
        id,
        stringifiedData,
        stringifiedData.length,
        metaData,
      );
    } catch (error) {
      this.logger.error(
        `Failed to write object "${id}" to bucket "${this.options.bucket}"`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async one<T>(id: string): Promise<T | undefined> {
    try {
      const idWithExtension = id.endsWith('.json') ? id : `${id}.json`;
      const streamReadable = await this.minioClient.getObject(
        this.options.bucket,
        idWithExtension,
      );
      const chunks = [];
      for await (const chunk of streamReadable) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);
      return JSON.parse(data.toString());
    } catch (error) {
      if ((error as any)?.code === 'NoSuchKey') {
        return undefined;
      }
      this.logger.error(
        `Failed to read object "${id}" from bucket "${this.options.bucket}"`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async all<T>(category: string): Promise<T[]> {
    const dataStream = this.minioClient.listObjects(
      this.options.bucket,
      category,
    );
    const data: T[] = [];

    for await (const obj of dataStream) {
      const singleData = await this.one<T>(obj.name);
      if (singleData) {
        data.push(singleData);
      }
    }
    return data;
  }

  async delete(id: string): Promise<void> {
    const idWithExtension = id.endsWith('.json') ? id : `${id}.json`;
    try {
      await this.minioClient.removeObject(this.options.bucket, idWithExtension);
    } catch (error) {
      this.logger.error(
        `Failed to delete object "${idWithExtension}" from bucket "${this.options.bucket}"`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
