import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';
import { IdentifierDto } from 'src/modules/identifier-management/dto/identifier.dto';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

const namespace = `e2e-${environment}-mock-hreflang-skeleton`;
const identificationKeyType = 'gtin';
const qualifierPath = '/';

const identifierDto = (): IdentifierDto => ({
  namespace,
  namespaceProfile: '',
  namespaceURI: '',
  applicationIdentifiers: [
    {
      ai: '01',
      shortcode: 'gtin',
      type: 'I',
      title: 'Global Trade Item Number (GTIN)',
      label: 'GTIN',
      regex: '(\\d{12,14}|\\d{8})',
      qualifiers: [],
    },
  ],
});

const headers = {
  Accept: 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

const buildPayload = (identificationKey: string, hreflang: string[]) => ({
  namespace,
  identificationKeyType,
  identificationKey,
  description: 'Hreflang round-trip test',
  qualifierPath,
  active: true,
  responses: [
    {
      defaultLinkType: true,
      defaultMimeType: true,
      defaultContext: true,
      fwqs: false,
      active: true,
      linkType: 'gs1:certificationInfo',
      context: 'au',
      title: 'Certification Information',
      targetUrl: 'https://example.com/cert',
      mimeType: 'application/json',
      hreflang,
    },
  ],
});

describe('LinkRegistration — hreflang walking skeleton (e2e)', () => {
  beforeAll(async () => {
    await request(baseUrl)
      .post('/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .send(identifierDto())
      .expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await request(baseUrl)
      .delete('/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .query({ namespace })
      .expect(HttpStatus.OK);
  });

  it('round-trips a single-value hreflang', async () => {
    const identificationKey = '12345678901234';
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send(buildPayload(identificationKey, ['en']))
      .expect(HttpStatus.CREATED);

    const res = await request(baseUrl)
      .get('/resolver/links')
      .query({ namespace, identificationKeyType, identificationKey })
      .set(headers)
      .expect(HttpStatus.OK);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].hreflang).toEqual(['en']);
  });

  it('round-trips a multi-value hreflang in order', async () => {
    const identificationKey = '12345678901235';
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send(buildPayload(identificationKey, ['en', 'fr', 'de']))
      .expect(HttpStatus.CREATED);

    const res = await request(baseUrl)
      .get('/resolver/links')
      .query({ namespace, identificationKeyType, identificationKey })
      .set(headers)
      .expect(HttpStatus.OK);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].hreflang).toEqual(['en', 'fr', 'de']);
  });

  it('round-trips an empty hreflang array', async () => {
    const identificationKey = '12345678901236';
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send(buildPayload(identificationKey, []))
      .expect(HttpStatus.CREATED);

    const res = await request(baseUrl)
      .get('/resolver/links')
      .query({ namespace, identificationKeyType, identificationKey })
      .set(headers)
      .expect(HttpStatus.OK);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].hreflang).toEqual([]);
  });
});
