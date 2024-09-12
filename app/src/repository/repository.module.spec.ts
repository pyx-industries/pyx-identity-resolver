import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryModule } from './repository.module';
import { RepositoryProvider } from './interfaces/repository-options.interface';
import { MinioModule } from './providers/minio/minio.module';
import { MinioProvider } from './providers/minio/minio.provider';

jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        putObject: jest.fn(),
        getObject: jest.fn(),
        listObjects: jest.fn(),
        bucketExists: jest.fn().mockResolvedValue(false),
        makeBucket: jest.fn(),
        removeObject: jest.fn(),
      };
    }),
  };
});

describe('RepositoryModule', () => {
  let moduleRef: TestingModule;
  let module: RepositoryModule;
  const options = {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    bucket: 'bucketName',
    provider: RepositoryProvider.Minio,
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [RepositoryModule.forRoot(options)],
    }).compile();

    module = moduleRef.get<RepositoryModule>(RepositoryModule);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import MinioModule', () => {
    const minioModule = moduleRef.resolve(MinioModule);
    expect(minioModule).toBeDefined();
  });

  it('should provide MinioProvider', () => {
    const minioProvider = moduleRef.resolve(MinioProvider);
    expect(minioProvider).toBeDefined();
  });

  it('should provide RepositoryProvider token', () => {
    const token = moduleRef.get('RepositoryProvider');
    expect(token).toBeDefined();
  });

  it('should throw an error if invalid provider is passed', async () => {
    try {
      await Test.createTestingModule({
        imports: [RepositoryModule.forRoot({ provider: 'invalid' } as any)],
      }).compile();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
