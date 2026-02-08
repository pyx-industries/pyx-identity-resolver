import { HttpStatus } from '@nestjs/common';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import request from 'supertest';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;

// Define namespace for e2e testing to avoid data pollution
const ns = `e2e-${environment}-access-role`;

describe('AccessRoleFilter (e2e)', () => {
  describe(`/${ns}/01/09520000000014 (GET) with access role responses`, () => {
    it('setup namespace and link registration', async () => {
      // Clean up any existing identifier data
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: ns });

      // Register namespace first (needed for management API)
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
          identificationKey: '09520000000014',
        });

      if (existingLinks.status === 200 && Array.isArray(existingLinks.body)) {
        for (const link of existingLinks.body) {
          await request(baseUrl)
            .delete(`/resolver/links/${link.linkId}`)
            .query({ hard: 'true' })
            .set('Authorization', `Bearer ${process.env.API_KEY}`);
        }
      }

      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: '09520000000014',
          itemDescription: 'Access Role DPP',
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
              title: 'Public Digital Product Passport',
              targetUrl: 'https://example.com/public-dpp',
              mimeType: 'application/json',
            },
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${ns}:dpp`,
              ianaLanguage: 'en',
              context: 'us',
              title: 'Customer Digital Product Passport',
              targetUrl: 'https://example.com/customer-dpp',
              mimeType: 'text/html',
              accessRole: ['untp:accessRole#Customer'],
            },
            {
              defaultLinkType: false,
              defaultMimeType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${ns}:dpp`,
              ianaLanguage: 'en',
              context: 'us',
              title: 'Regulator Digital Product Passport',
              targetUrl: 'https://example.com/regulator-dpp',
              mimeType: 'application/pdf',
              accessRole: ['untp:accessRole#Regulator'],
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

    it('linkType=all without accessRole returns all links', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      expect(linkset).not.toBeNull();

      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).toContain('https://example.com/customer-dpp');
      expect(targetUrls).toContain('https://example.com/regulator-dpp');
    });

    it('linkType=all with accessRole=customer returns public and customer only', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=customer`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      expect(linkset).not.toBeNull();

      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).toContain('https://example.com/customer-dpp');
      expect(targetUrls).not.toContain('https://example.com/regulator-dpp');
    });

    it('linkType=all with accessRole=regulator returns public and regulator only', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=regulator`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      expect(linkset).not.toBeNull();

      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).toContain('https://example.com/regulator-dpp');
      expect(targetUrls).not.toContain('https://example.com/customer-dpp');
    });

    it('linkType=all with accessRole=unknown returns only public links', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=unknown`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      expect(linkset).not.toBeNull();

      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      expect(dppKey).toBeDefined();

      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).not.toContain('https://example.com/customer-dpp');
      expect(targetUrls).not.toContain('https://example.com/regulator-dpp');
    });

    it('specific linkType with accessRole=customer redirects to customer target', () => {
      return request(baseUrl)
        .get(
          `/${ns}/01/09520000000014?linkType=${ns}%3Adpp&accessRole=customer`,
        )
        .set('Accept', 'text/html')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'https://example.com/customer-dpp');
    });

    it('specific linkType with accessRole=regulator redirects to regulator target', () => {
      return request(baseUrl)
        .get(
          `/${ns}/01/09520000000014?linkType=${ns}%3Adpp&accessRole=regulator`,
        )
        .set('Accept', 'application/pdf')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'https://example.com/regulator-dpp');
    });

    it('linkType=all with accessRole=CUSTOMER (uppercase) returns public and customer only', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=CUSTOMER`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).toContain('https://example.com/customer-dpp');
      expect(targetUrls).not.toContain('https://example.com/regulator-dpp');
    });

    it('linkType=all with full URI accessRole returns public and customer only', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=untp:accessRole%23Customer`)
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      const linksetEntry = linkset[0];
      const dppKey = Object.keys(linksetEntry).find((key) =>
        key.includes('/dpp'),
      );
      const dppLinks = linksetEntry[dppKey!];
      const targetUrls = dppLinks.map((link: { href: string }) => link.href);

      expect(targetUrls).toContain('https://example.com/public-dpp');
      expect(targetUrls).toContain('https://example.com/customer-dpp');
      expect(targetUrls).not.toContain('https://example.com/regulator-dpp');
    });

    it('Link header excludes filtered responses', async () => {
      const res = await request(baseUrl)
        .get(`/${ns}/01/09520000000014?linkType=all&accessRole=customer`)
        .expect(200);

      const linkHeader = res.headers['link'];
      expect(linkHeader).toBeDefined();
      expect(linkHeader).toContain('https://example.com/public-dpp');
      expect(linkHeader).toContain('https://example.com/customer-dpp');
      expect(linkHeader).not.toContain('https://example.com/regulator-dpp');
    });
  });

  describe(`/${ns}/01/09520000000015 (GET) all responses restricted`, () => {
    it('setup link registration with only restricted responses', async () => {
      const existingLinks = await request(baseUrl)
        .get('/resolver/links')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: '09520000000015',
        });

      if (existingLinks.status === 200 && Array.isArray(existingLinks.body)) {
        for (const link of existingLinks.body) {
          await request(baseUrl)
            .delete(`/resolver/links/${link.linkId}`)
            .query({ hard: 'true' })
            .set('Authorization', `Bearer ${process.env.API_KEY}`);
        }
      }

      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace: ns,
          identificationKeyType: 'gtin',
          identificationKey: '09520000000015',
          itemDescription: 'All Restricted DPP',
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
              title: 'Regulator Only DPP',
              targetUrl: 'https://example.com/regulator-only',
              mimeType: 'application/json',
              accessRole: ['untp:accessRole#Regulator'],
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(201);
    });

    it('returns 404 when accessRole filter excludes all responses', async () => {
      await request(baseUrl)
        .get(`/${ns}/01/09520000000015?linkType=all&accessRole=customer`)
        .expect(404);
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
