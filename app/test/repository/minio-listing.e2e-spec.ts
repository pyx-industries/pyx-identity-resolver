import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryModule } from '../../src/repository/repository.module';
import { RepositoryProvider } from '../../src/repository/interfaces/repository-options.interface';
import { IRepositoryProvider } from '../../src/repository/providers/provider.repository.interface';

// MinIO lists at most 1000 objects per page and puts two XML entities into
// every ETag of the listing it returns. 1001 objects therefore give a first
// page with more entities than the 1000 expansions fast-xml-parser 4.5.5 to
// 4.5.7 allow by default, and a second page. MinioProvider.all() must still
// return every object. The per-run prefix keeps these objects out of the
// identifier and link listings the other suites read.
const prefix = `e2e-listing-${randomUUID()}/`;
const ids = Array.from(
  { length: 1001 },
  (_, i) => `${prefix}${String(i).padStart(4, '0')}`,
);

async function inBatches(
  send: (id: string) => Promise<void>,
): Promise<PromiseSettledResult<void>[]> {
  const results: PromiseSettledResult<void>[] = [];
  for (let i = 0; i < ids.length; i += 25) {
    results.push(...(await Promise.allSettled(ids.slice(i, i + 25).map(send))));
  }
  return results;
}

describe('MinioProvider listing past one page (e2e)', () => {
  let moduleRef: TestingModule;
  let repository: IRepositoryProvider;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
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
      ],
    }).compile();
    repository = moduleRef.get<IRepositoryProvider>('RepositoryProvider');

    const saved = await inBatches((id) => repository.save({ id }));
    expect(saved.filter((result) => result.status === 'rejected')).toEqual([]);
  }, 120_000);

  afterAll(async () => {
    // Nothing was written if the module never compiled.
    if (!repository) return;
    const deleted = await inBatches((id) => repository.delete(id));
    const remaining = await repository.all(prefix);
    await moduleRef.close();

    expect(deleted.filter((result) => result.status === 'rejected')).toEqual(
      [],
    );
    expect(remaining).toEqual([]);
  }, 120_000);

  it('should return all 1001 objects under the prefix', async () => {
    const listed = await repository.all<{ id: string }>(prefix);

    expect(listed.map((object) => object.id).sort()).toEqual(ids);
  }, 60_000);
});
