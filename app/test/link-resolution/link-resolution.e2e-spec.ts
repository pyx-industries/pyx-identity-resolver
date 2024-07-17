import { HttpStatus } from '@nestjs/common';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import request from 'supertest';

const baseUrl = process.env.RESOLVER_DOMAIN;
const environment = process.env.NODE_ENV;

// Define namespaces for e2e testing to avoid data pollution
const gs1 = `e2e-${environment}-mock-gs1`;

describe('LinkResolutionController (e2e)', () => {
  describe('/e2e-test-mock-gs1/01/09359502000041 (GET) with default responses are set', () => {
    it('setup namespace and link registration', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
            qualifiers: ['22', '10', '21'],
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
          {
            ai: '21',
            shortcode: 'ser',
            type: 'Q',
            title: 'Serial number',
            label: 'SERIAL',
            regex:
              '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
          },
          {
            ai: '22',
            shortcode: 'cpv',
            type: 'Q',
            title: 'Consumer product variant',
            label: 'CPV',
            regex:
              '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
          },
        ],
      };
      const res = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      if (res.body) {
        await request(baseUrl)
          .post('/api/resolver')
          .send({
            namespace: gs1,
            identificationKeyType: 'gtin',
            identificationKey: '09359502000041',
            itemDescription: 'DPP',
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
                linkType: gs1 + ':certificationInfo',
                ianaLanguage: 'en',
                context: 'us',
                title: 'Certification Information',
                targetUrl: 'https://example-json.com',
                mimeType: 'application/json',
              },
              {
                defaultLinkType: true,
                defaultMimeType: true,
                defaultIanaLanguage: true,
                defaultContext: true,
                fwqs: true,
                active: true,
                linkType: gs1 + ':certificationInfo',
                ianaLanguage: 'en',
                context: 'us',
                title: 'Certification Information',
                targetUrl: 'https://example-html.com',
                mimeType: 'text/html',
              },
              {
                defaultLinkType: true,
                defaultMimeType: true,
                defaultIanaLanguage: true,
                defaultContext: true,
                fwqs: false,
                active: true,
                linkType: gs1 + ':certificationInfo',
                ianaLanguage: 'en',
                context: 'au',
                title: 'Certification Information',
                targetUrl: 'https://example-json.com',
                mimeType: 'application/json',
              },
              {
                defaultLinkType: true,
                defaultMimeType: true,
                defaultIanaLanguage: true,
                defaultContext: true,
                fwqs: false,
                active: true,
                linkType: gs1 + ':certificationInfo',
                ianaLanguage: 'en',
                context: 'au',
                title: 'Certification Information',
                targetUrl: 'https://example-html.com',
                mimeType: 'text/html',
              },
              {
                defaultLinkType: true,
                defaultMimeType: true,
                defaultIanaLanguage: true,
                defaultContext: true,
                fwqs: false,
                active: false,
                linkType: gs1 + ':certificationInfo',
                ianaLanguage: 'en',
                context: 'gb',
                title: 'Certification Information',
                targetUrl: 'https://example-html.com',
                mimeType: 'text/html',
              },
            ],
          })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${process.env.API_KEY}`)
          .expect(201)
          .expect({
            message: 'Link resolver registered successfully',
          });
      }
    });

    it('when linkType is certificationInfo language is en, context is US, and mimeType is application/json', async () => {
      await request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });

    it('when linkType is certificationInfo language is en, context is US, and mimeType is text/html', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept', 'text/html')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect(
          'Location',
          `https://example-html.com?linkType=${gs1}:certificationInfo`,
        );
    });

    it('when linkType is certificationInfo language is en, context is AU, and mimeType is application/json', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect('Location', 'https://example-json.com');
    });

    it('when linkType is certificationInfo language is en, context is AU, and mimeType is text/html', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept', 'text/html')
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect('Location', 'https://example-html.com');
    });

    it('when linkType is certificationInfo language is en, context is US, and mimeType is unknown', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });

    it('when linkType is certificationInfo language is en, context is unknown, and mimeType is unknown', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .set('Accept-Language', 'en')
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });

    it('when linkType is certificationInfo language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });

    it('when linkType is unknown, language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo`)
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });

    it('when linkType is all', async () => {
      const res = await request(baseUrl)
        .get(`/${gs1}/01/09359502000041?linkType=all`)
        .expect(200)
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );

      expect(JSON.parse(res.text).linkset).not.toBeNull();
      expect(JSON.parse(res.text).linkset[0].anchor).toBe(
        `${baseUrl}/e2e-test-mock-gs1/01/09359502000041`,
      );
    });
  });

  describe('/e2e-test-mock-gs1/01/09359502000041 (GET) with no default responses set', () => {
    it('when linkType is unknown language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/09359502000041`)
        .expect(302)
        .expect('Location', 'https://example-json.com');
    });

    it('when linkType is certificationInfo language is en, context is AU, and mimeType is application/json, the response fwqs is set true', () => {
      return request(baseUrl)
        .get(
          `/${gs1}/01/09359502000041?linkType=${gs1}%3AcertificationInfo&query1=1&query2=2`,
        )
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-us')
        .expect(302)
        .expect(
          'Location',
          `https://example-json.com?linkType=${gs1}:certificationInfo&query1=1&query2=2`,
        )
        .expect(
          'Link',
          `<https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-json.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <https://example-html.com>; rel="e2e-test-mock-gs1:certificationInfo"; type="text/html"; hreflang="en"; title="Certification Information", <${baseUrl}/e2e-test-mock-gs1/01/09359502000041>; rel="owl:sameAs"`,
        );
    });
  });

  describe('invalid URI', () => {
    it('when id is invalid', () => {
      return request(baseUrl)
        .get(`/${gs1}/01/invalid_id`)
        .expect(400)
        .expect((res) => {
          expect(JSON.parse(res.text).errors[0].message).toBe(`Invalid value`);
        });
    });

    it('when primaryIdentifier is invalid', () => {
      return request(baseUrl)
        .get(`/${gs1}/invalid/09359502000042`)
        .expect(400)
        .expect((res) => {
          expect(JSON.parse(res.text).errors[0].message).toBe(
            `Primary identifier 'invalid' not found`,
          );
        });
    });

    it('when namespace is invalid', () => {
      return request(baseUrl)
        .get('/invalid/01/09359502000041')
        .expect(404)
        .expect((res) => {
          expect(JSON.parse(res.text).errors[0].message).toBe(
            'Identifier not found',
          );
        });
    });
  });

  // Clean up
  it('delete namespace', async () => {
    await request(baseUrl)
      .delete('/api/identifiers')
      .set('Authorization', `Bearer ${process.env.API_KEY}`)
      .query({ namespace: gs1 })
      .expect(HttpStatus.OK);
  });
});
