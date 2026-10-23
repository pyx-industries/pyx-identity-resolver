import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';

const baseUrl = process.env.RESOLVER_DOMAIN + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;

// Each identifier is one stored object. MinIO lists at most 1000 objects per
// page and puts two XML entities into every ETag of the listing it returns.
// 1001 identifiers therefore give a first page with more entities than the
// 1000 expansions fast-xml-parser 4.5.5 to 4.5.7 allow by default, and a
// second page. GET /identifiers must still return every one of them.
const prefix = `e2e-${environment}-listing-`;
const namespaces = Array.from(
  { length: 1001 },
  (_, i) => `${prefix}${String(i).padStart(4, '0')}`,
);

async function inBatches(
  items: string[],
  send: (namespace: string) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < items.length; i += 25) {
    await Promise.all(items.slice(i, i + 25).map(send));
  }
}

describe('IdentifierManagementController listing past one page (e2e)', () => {
  beforeAll(async () => {
    await inBatches(namespaces, (namespace) => {
      const identifierDto: IdentifierDto = {
        namespace,
        applicationIdentifiers: [],
      };
      return request(baseUrl)
        .post('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);
    });
  }, 120_000);

  afterAll(async () => {
    await inBatches(namespaces, (namespace) =>
      request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace }),
    );
  }, 120_000);

  it('should retrieve all 1001 identifiers', async () => {
    const response = await request(baseUrl)
      .get('/identifiers')
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .expect(HttpStatus.OK);

    const listed = (response.body as IdentifierDto[])
      .map((identifier) => identifier.namespace)
      .filter((namespace) => namespace.startsWith(prefix))
      .sort();
    expect(listed).toEqual(namespaces);
  }, 60_000);
});
