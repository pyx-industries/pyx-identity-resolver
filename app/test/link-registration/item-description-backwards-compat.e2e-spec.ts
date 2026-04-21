import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';
import { IdentifierDto } from 'src/modules/identifier-management/dto/identifier.dto';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

const namespace = `e2e-${environment}-mock-item-description`;

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

const baseResponse = {
  defaultLinkType: true,
  defaultMimeType: true,
  defaultIanaLanguage: true,
  defaultContext: true,
  fwqs: false,
  active: true,
  linkType: 'gs1:certificationInfo',
  ianaLanguage: 'en',
  context: 'au',
  title: 'Certification Information',
  targetUrl: 'https://example.com',
  mimeType: 'application/json',
};

const headers = {
  Accept: 'application/json',
  Authorization: `Bearer ${apiKey}`,
};

describe('LinkRegistration — itemDescription backwards compatibility (e2e)', () => {
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

  it('accepts a registration when only itemDescription is provided and stores it as description', async () => {
    const identificationKey = '10000000000017';
    const legacyDescription = 'Legacy item description only';

    await request(baseUrl)
      .post('/resolver')
      .send({
        namespace,
        identificationKeyType,
        identificationKey,
        itemDescription: legacyDescription,
        qualifierPath,
        active: true,
        responses: [baseResponse],
      })
      .set(headers)
      .expect(HttpStatus.CREATED)
      .expect({ message: 'Link resolver registered successfully' });

    const res = await request(baseUrl)
      .get(`/${namespace}/${identificationKeyType}/${identificationKey}`)
      .set('Accept', 'application/linkset+json')
      .expect(200);

    const body = JSON.parse(res.text);
    expect(body.linkset[0].description).toBe(legacyDescription);
  });

  it('prefers description over itemDescription when both are provided', async () => {
    const identificationKey = '10000000000024';
    const canonical = 'Canonical description';
    const legacy = 'Legacy item description';

    await request(baseUrl)
      .post('/resolver')
      .send({
        namespace,
        identificationKeyType,
        identificationKey,
        description: canonical,
        itemDescription: legacy,
        qualifierPath,
        active: true,
        responses: [baseResponse],
      })
      .set(headers)
      .expect(HttpStatus.CREATED);

    const res = await request(baseUrl)
      .get(`/${namespace}/${identificationKeyType}/${identificationKey}`)
      .set('Accept', 'application/linkset+json')
      .expect(200);

    const body = JSON.parse(res.text);
    expect(body.linkset[0].description).toBe(canonical);
    expect(body.linkset[0].itemDescription).toBeUndefined();
  });

  it('rejects a registration that omits both description and itemDescription', async () => {
    const identificationKey = '10000000000031';

    await request(baseUrl)
      .post('/resolver')
      .send({
        namespace,
        identificationKeyType,
        identificationKey,
        qualifierPath,
        active: true,
        responses: [baseResponse],
      })
      .set(headers)
      .expect(HttpStatus.BAD_REQUEST);
  });
});
