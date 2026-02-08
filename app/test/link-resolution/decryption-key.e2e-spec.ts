import { HttpStatus } from '@nestjs/common';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;

// Define namespace for e2e testing to avoid data pollution
const ns = `e2e-${environment}-decryption-key`;

const gtinFwqsTrue = '09520000000021';
const gtinFwqsFalse = '09520000000038';

describe('DecryptionKey forwarding (e2e)', () => {
  describe(`/${ns}/01/${gtinFwqsTrue} (GET) with fwqs=true`, () => {
    it('setup namespace and link registration', async () => {
      // Clean up any existing identifier data
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: ns });

      // Register namespace with application identifiers
      const identifierDto: IdentifierDto = {
        namespace: ns,
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
            qualifiers: ['10'],
          },
          {
            ai: '10',
            shortcode: 'lot',
            type: 'Q',
            title: 'Batch or lot number',
            label: 'BATCH/LOT',
            regex:
              '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
          },
        ],
      };

      const res = await request(baseUrl)
        .post('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      // Hard-delete any existing links from previous test runs
      const existingLinks = await request(baseUrl)
        .get('/resolver/links')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: gtinFwqsTrue,
        });

      if (existingLinks.status === 200 && Array.isArray(existingLinks.body)) {
        for (const link of existingLinks.body) {
          await request(baseUrl)
            .delete(`/resolver/links/${link.linkId}`)
            .query({ hard: 'true' })
            .set('Authorization', `Bearer ${process.env.API_KEY}`);
        }
      }

      // Register link with fwqs=true and encryptionMethod=AES-256
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: gtinFwqsTrue,
          itemDescription: 'Encrypted DPP (fwqs enabled)',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: true,
              active: true,
              linkType: `${ns}:dpp`,
              ianaLanguage: 'en',
              context: 'us',
              title: 'Encrypted Digital Product Passport',
              targetUrl: 'https://example.com/encrypted-dpp',
              mimeType: 'application/json',
              encryptionMethod: 'AES-256',
              accessRole: ['untp:accessRole#Customer'],
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });
    });

    it('decryptionKey is forwarded on redirect when fwqs=true', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/${gtinFwqsTrue}?decryptionKey=mysecret`)
        .redirects(0)
        .expect(302);

      expect(res.headers['location']).toContain('decryptionKey=mysecret');
    });

    it('decryptionKey is not present in linkset response (linkType=all)', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/${gtinFwqsTrue}?linkType=all&decryptionKey=mysecret`)
        .set('Accept', 'application/json')
        .expect(200);

      const bodyString = JSON.stringify(res.body);
      expect(bodyString).not.toContain('decryptionKey');
    });

    it('decryptionKey is not present in linkset+json response', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/${gtinFwqsTrue}?decryptionKey=mysecret`)
        .set('Accept', 'application/linkset+json')
        .expect(200);

      const bodyString = JSON.stringify(res.body);
      expect(bodyString).not.toContain('decryptionKey');
      expect(bodyString).not.toContain('mysecret');
    });

    it('decryptionKey is not present in Link header', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/${gtinFwqsTrue}?linkType=all&decryptionKey=mysecret`)
        .expect(200);

      const linkHeader = res.headers['link'];
      expect(linkHeader).toBeDefined();
      expect(linkHeader).not.toContain('decryptionKey');
      expect(linkHeader).not.toContain('mysecret');
    });

    it('decryptionKey is forwarded alongside accessRole on redirect', async () => {
      const res = await request(baseUrl)
        .get(
          `/${ns}/01/${gtinFwqsTrue}?accessRole=customer&decryptionKey=mysecret`,
        )
        .redirects(0)
        .expect(302);

      expect(res.headers['location']).toContain('accessRole=customer');
      expect(res.headers['location']).toContain('decryptionKey=mysecret');
    });
  });

  describe(`/${ns}/01/${gtinFwqsFalse} (GET) with fwqs=false`, () => {
    it('setup link registration with fwqs=false', async () => {
      // Hard-delete any existing links from previous test runs
      const existingLinks = await request(baseUrl)
        .get('/resolver/links')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: gtinFwqsFalse,
        });

      if (existingLinks.status === 200 && Array.isArray(existingLinks.body)) {
        for (const link of existingLinks.body) {
          await request(baseUrl)
            .delete(`/resolver/links/${link.linkId}`)
            .query({ hard: 'true' })
            .set('Authorization', `Bearer ${process.env.API_KEY}`);
        }
      }

      // Register link with fwqs=false
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: gtinFwqsFalse,
          itemDescription: 'Encrypted DPP (fwqs disabled)',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: `${ns}:dpp`,
              ianaLanguage: 'en',
              context: 'us',
              title: 'Encrypted Digital Product Passport (no fwqs)',
              targetUrl: 'https://example.com/encrypted-dpp-no-fwqs',
              mimeType: 'application/json',
              encryptionMethod: 'AES-256',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });
    });

    it('decryptionKey is dropped on redirect when fwqs=false', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/${gtinFwqsFalse}?decryptionKey=mysecret`)
        .redirects(0)
        .expect(302);

      expect(res.headers['location']).not.toContain('decryptionKey');
    });
  });

  describe('cleanup', () => {
    it('delete namespace', async () => {
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: ns })
        .expect(HttpStatus.OK);
    });
  });
});
