import { Test, TestingModule } from '@nestjs/testing';
import * as Minio from 'minio';
import { MinioProvider } from './minio.provider';
import { REPOSITORY_MODULE_OPTIONS } from '../../repository.constants';
import { UploadedObjectInfo } from 'minio/dist/main/internal/type';
import { Readable } from 'node:stream';

describe('MinioProvider', () => {
  let provider: MinioProvider;
  let minioClient: Minio.Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioProvider,
        {
          provide: 'MinioRepository',
          useValue: {
            putObject: jest.fn(),
            getObject: jest.fn(),
            listObjects: jest.fn(),
            bucketExists: jest.fn(),
            makeBucket: jest.fn(),
            removeObject: jest.fn(),
          },
        },
        {
          provide: REPOSITORY_MODULE_OPTIONS,
          useValue: {
            bucket: 'test',
          },
        },
      ],
    }).compile();

    minioClient = module.get('MinioRepository');
    provider = module.get<MinioProvider>(MinioProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should save data successfully', async () => {
    const data = { id: 'test.json', name: 'John Doe' };
    jest
      .spyOn(minioClient, 'putObject')
      .mockImplementation(() => Promise.resolve({} as UploadedObjectInfo));
    await provider.save(data);
  });

  it('should retrieve one item by ID', async () => {
    const id = 'test.json';
    jest.spyOn(minioClient, 'getObject').mockImplementation(() => {
      const promise = new Promise<Readable>((resolve) => {
        const stream = new Readable();
        stream.push(JSON.stringify({ id, name: 'John Doe' }));
        stream.push(null);
        resolve(stream);
      });
      return promise;
    });
    const result = await provider.one(id);
    expect(result).toEqual({ id, name: 'John Doe' });
  });

  it('should retrieve all items by category', async () => {
    const category = 'users';
    jest.spyOn(minioClient, 'listObjects').mockImplementation(() => {
      return [{ name: `${category}/test.json` }] as any;
    });

    jest.spyOn(minioClient, 'getObject').mockImplementation(() => {
      const promise = new Promise<Readable>((resolve) => {
        const stream = new Readable();
        stream.push(
          JSON.stringify({ id: `${category}/test.json`, name: 'John Doe' }),
        );
        stream.push(null);
        resolve(stream);
      });
      return promise;
    });
    const results = await provider.all(category);

    expect(results).toEqual([
      { id: `${category}/test.json`, name: 'John Doe' },
    ]);
  });

  it('should delete an item by ID', async () => {
    const id = 'test.json';
    jest
      .spyOn(minioClient, 'removeObject')
      .mockImplementation(() => Promise.resolve());
    await provider.delete(id);
  });
});
