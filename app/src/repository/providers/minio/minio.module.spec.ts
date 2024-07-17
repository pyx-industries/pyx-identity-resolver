import { Test, TestingModule } from '@nestjs/testing';
import { MinioModule } from './minio.module';
import { MinioProvider } from './minio.provider';
import { RepositoryProvider } from '../../interfaces/repository-options.interface';
import { getRepositoryToken } from '../../repository.utils';
import { REPOSITORY_MODULE_OPTIONS } from '../../repository.constants';

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

describe('MinioModule', () => {
  let minioModule: MinioModule;
  let moduleRef: TestingModule;
  const options = {
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    bucket: 'bucketName',
    provider: RepositoryProvider.Minio,
    pathStyle: false,
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MinioModule.forRoot(options)],
    }).compile();

    minioModule = moduleRef.get<MinioModule>(MinioModule);
  });

  it('should be defined', () => {
    expect(minioModule).toBeDefined();
  });

  it('should provide the MinioProvider', async () => {
    const minioProvider = await moduleRef.resolve(MinioProvider);
    expect(minioProvider).toBeDefined();
  });

  it('should provide the MinioRepository', async () => {
    const token = getRepositoryToken('Minio');
    const minioRepository = await moduleRef.resolve(token);
    expect(minioRepository).toBeDefined();
  });

  it('should have the correct options', () => {
    const repositoryModuleOptions = moduleRef.get(REPOSITORY_MODULE_OPTIONS);
    expect(repositoryModuleOptions).toEqual(options);
  });
});
