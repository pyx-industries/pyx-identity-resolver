import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';
import { IdentifierDto } from 'src/modules/identifier-management/dto/identifier.dto';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

const namespace = `e2e-${environment}-mock-hreflang-emission`;
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
  description: 'Hreflang linkset emission test',
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

const fetchLinkset = async (identificationKey: string) => {
  const res = await request(baseUrl)
    .get(`/${namespace}/01/${identificationKey}?linkType=all`)
    .set('Accept', 'application/json')
    .expect(HttpStatus.OK);
  return res.body.linkset[0];
};

const certInfoTargets = (linkset: any) => {
  const key = Object.keys(linkset).find((k) =>
    k.endsWith('/certificationInfo'),
  );
  return key ? linkset[key] : undefined;
};

describe('LinkRegistration — hreflang linkset emission (e2e)', () => {
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

  it('emits per-variant hreflang on the published linkset target', async () => {
    const identificationKey = '22345678901234';
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send(buildPayload(identificationKey, ['en', 'fr', 'de']))
      .expect(HttpStatus.CREATED);

    const linkset = await fetchLinkset(identificationKey);
    const targets = certInfoTargets(linkset);

    expect(targets).toBeDefined();
    expect(targets).toHaveLength(1);
    expect(targets[0].hreflang).toEqual(['en', 'fr', 'de']);
  });

  it('emits an empty hreflang array on the linkset target when explicitly set', async () => {
    const identificationKey = '22345678901235';
    await request(baseUrl)
      .post('/resolver')
      .set(headers)
      .send(buildPayload(identificationKey, []))
      .expect(HttpStatus.CREATED);

    const linkset = await fetchLinkset(identificationKey);
    const targets = certInfoTargets(linkset);

    expect(targets).toBeDefined();
    expect(targets).toHaveLength(1);
    expect(targets[0].hreflang).toEqual([]);
  });
});
