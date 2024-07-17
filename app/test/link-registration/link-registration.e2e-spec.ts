import { HttpStatus } from '@nestjs/common';
import { IdentifierDto } from 'src/modules/identifier-management/dto/identifier.dto';
import request from 'supertest';

const baseUrl = process.env.RESOLVER_DOMAIN;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

// Define namespaces for e2e testing to avoid data pollution
const gs1 = `e2e-${environment}-mock-gs1`;

describe('LinkResolutionController (e2e)', () => {
  describe('/api/resolver (POST)', () => {
    const createIdentifierDto = (): IdentifierDto => ({
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
    });

    const registerIdentifier = async (identifierDto: IdentifierDto) => {
      const res = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      return res;
    };

    beforeAll(async () => {
      const identifierDto = createIdentifierDto();
      const res = await registerIdentifier(identifierDto);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });
    });

    it('should register a new link resolver with valid payload', async () => {
      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          itemDescription: 'DPP',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          active: true,
          responses: [
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
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
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

    it('should register a new link resolver when missing the qualifierPath', async () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '1234567890123499',
          // missing qualifierPath
          itemDescription: 'DPP',
          active: true,
          responses: [
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
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
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

    it('should update resolver with other linkType', async () => {
      // Define constants for repeated values
      const identificationKeyType = 'gtin';
      const identificationKey = '12345678901234';
      const qualifierPath = '/10/12345678901234567890/22/ABCDE';
      const namespace = gs1;

      const resolverPayload = (
        linkType: string,
        title: string,
        targetUrl: string,
      ) => ({
        namespace,
        identificationKeyType,
        identificationKey,
        itemDescription: 'DPP',
        qualifierPath,
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            fwqs: false,
            active: true,
            linkType: `${namespace}:${linkType}`,
            ianaLanguage: 'en',
            context: 'au',
            title,
            targetUrl,
            mimeType: 'application/json',
          },
        ],
      });

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.API_KEY}`,
      };

      // Register first link resolver
      await request(baseUrl)
        .post('/api/resolver')
        .send(
          resolverPayload(
            'certificationInfo',
            'Certification Information',
            'https://example.com',
          ),
        )
        .set(headers)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });

      // Register second link resolver with a different linkType
      await request(baseUrl)
        .post('/api/resolver')
        .send(
          resolverPayload(
            'epcis',
            'Epcis Information',
            'https://example-epics.com',
          ),
        )
        .set(headers)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });

      // Verify that both link types are present in the response
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}${qualifierPath}`,
        )
        .set('Accept', 'application/json')
        .expect(302)
        .expect(
          'Link',
          `<https://example.com>; rel="${namespace}:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <https://example-epics.com>; rel="${namespace}:epcis"; type="application/json"; hreflang="en"; title="Epcis Information", <${baseUrl}/e2e-test-mock-gs1/01/12345678901234/10/12345678901234567890/22/ABCDE>; rel="owl:sameAs"`,
        );
    });

    it('should handle duplicate registration and result in only one link', async () => {
      // create a new namespace for testing
      const namespace = `e2e-${environment}-mock-duplicate`;
      const identifierDto = createIdentifierDto();
      identifierDto.namespace = namespace;
      const res = await registerIdentifier(identifierDto);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      // Define constants for repeated values
      const identificationKeyType = 'gtin';
      const identificationKey = '12345678901234';
      const qualifierPath = '/10/12345678901234567890/22/ABCDE';

      const resolverPayload = (
        linkType: string,
        title: string,
        targetUrl: string,
      ) => ({
        namespace,
        identificationKeyType,
        identificationKey,
        itemDescription: 'DPP',
        qualifierPath,
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            fwqs: false,
            active: true,
            linkType: `${namespace}:${linkType}`,
            ianaLanguage: 'en',
            context: 'au',
            title,
            targetUrl,
            mimeType: 'application/json',
          },
        ],
      });

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.API_KEY}`,
      };

      // Register the link resolver for the first time
      await request(baseUrl)
        .post('/api/resolver')
        .send(
          resolverPayload(
            'certificationInfo',
            'Certification Information',
            'https://example.com',
          ),
        )
        .set(headers)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });

      // Register the same link resolver for the second time (duplicate)
      await request(baseUrl)
        .post('/api/resolver')
        .send(
          resolverPayload(
            'certificationInfo',
            'Certification Information',
            'https://example.com',
          ),
        )
        .set(headers)
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });

      // Verify that only one link exists after duplicate registration
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}${qualifierPath}`,
        )
        .set('Accept', 'application/json')
        .expect(302)
        .expect(
          'Link',
          `<https://example.com>; rel="${namespace}:certificationInfo"; type="application/json"; hreflang="en"; title="Certification Information", <${baseUrl}/${namespace}/01/12345678901234/10/12345678901234567890/22/ABCDE>; rel="owl:sameAs"`,
        );

      // cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace })
        .expect(HttpStatus.OK);
    });

    it('should throw an error if namespace is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          // missing namespace
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            { field: 'namespace', message: 'namespace should not be empty' },
            { field: 'namespace', message: 'namespace must be a string' },
          ]);
        });
    });

    it('should throw an error if identificationKeyType is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          // missing identificationKeyType
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'identificationKeyType',
              message: 'identificationKeyType should not be empty',
            },
            {
              field: 'identificationKeyType',
              message: 'identificationKeyType must be a string',
            },
          ]);
        });
    });

    it('should throw an error if identificationKey is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          // missing identificationKey
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'identificationKey',
              message: 'identificationKey should not be empty',
            },
            {
              field: 'identificationKey',
              message: 'identificationKey must be a string',
            },
          ]);
        });
    });

    it('should throw an error if itemDescription is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          // missing itemDescription
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'itemDescription',
              message: 'itemDescription should not be empty',
            },
            {
              field: 'itemDescription',
              message: 'itemDescription must be a string',
            },
          ]);
        });
    });

    it('should throw an error if active is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          // missing active
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'active',
              message: 'active must be a boolean',
            },
          ]);
        });
    });

    it('should throw an error if responses is not found', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          // missing responses
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses',
              message: 'responses should not be an empty array',
            },
            {
              field: 'responses',
              message: 'responses must be an array',
            },
          ]);
        });
    });

    it('should throw a bad request error for invalid active', async () => {
      await request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: 'invalid', // invalid active
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'active',
              message: 'active must be a boolean',
            },
          ]);
        });
    });

    it('should throw an error if qualifier path are present but not in the identifier qualifiers', async () => {
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/11/12345678901234567890', // invalid qualifier path
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'qualifierPath',
              message:
                "Qualifier '11' not found in the primary application identifier gtin (01)",
            },
          ]);
        });
    });

    it('should throw an error if the qualifier value does not match the regex', async () => {
      // Register a new link resolver
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/1234567890123456789101123123invalid', // invalid qualifier path
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'qualifierPath',
              message:
                "Qualifier value '1234567890123456789101123123invalid' does not match regex '([!%-?A-Z_a-z\\x22]{1,20})'",
            },
          ]);
        });
    });

    it('should throw an error for invalid identificationKeyType', async () => {
      // Register a new link resolver
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'invalid', // invalid identification key type
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'identificationKeyType',
              message: `Identification key type 'invalid' is not registered with the namespace '${gs1}'`,
            },
          ]);
        });
    });

    it('should throw an error for invalid identificationKey', async () => {
      // Register a new link resolver
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: 'invalid', // invalid identification key
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'identificationKey',
              message:
                "Identification key 'invalid' does not match regex '(\\d{12,14}|\\d{8})'",
            },
          ]);
        });
    });

    it('should throw an error for invalid qualifierPath', async () => {
      // Register a new link resolver
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: 'invalid', // invalid qualifier path
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'qualifierPath',
              message: "Invalid qualifier path 'invalid'",
            },
          ]);
        });
    });

    it('should throw a bad request error for invalid responses', () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: 'invalid', // invalid responses
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses',
              message: 'responses should not be an empty array',
            },
            {
              field: 'responses',
              message: 'responses must be an array',
            },
            {
              field: 'responses',
              message: 'responses nested validation failed',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's defaultLinkType", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: 'invalid', // invalid default link type
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.defaultLinkType',
              message: 'defaultLinkType must be a boolean',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's defaultMimeType", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: 'invalid', // invalid default mime type
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
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.defaultMimeType',
              message: 'defaultMimeType must be a boolean',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's fwqs", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: 'invalid', // invalid fwqs
              active: true,
              linkType: 'gs1:certificationInfo',
              ianaLanguage: 'en',
              context: 'au',
              title: 'Certification Information',
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.fwqs',
              message: 'fwqs must be a boolean',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's active", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: 'invalid', // invalid active
              linkType: 'gs1:certificationInfo',
              ianaLanguage: 'en',
              context: 'au',
              title: 'Certification Information',
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.active',
              message: 'active must be a boolean',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's linkType", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: 'invalid', // invalid link type
              ianaLanguage: 'en',
              context: 'au',
              title: 'Certification Information',
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'linkType',
              message:
                "Invalid namespace prefix: 'invalid'. Expected: 'e2e-test-mock-gs1'",
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's linkTitle", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: 'gs1:certificationInfo',
              ianaLanguage: 'en',
              context: 'au',
              title: '', // invalid title
              targetUrl: 'https://example.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.title',
              message: 'title should not be empty',
            },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's targetUrl", async () => {
      const identifierDto = createIdentifierDto();
      await registerIdentifier(identifierDto);

      request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
              targetUrl: 'invalid', // invalid target URL
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            { field: 'targetUrl', message: 'errors.isUrl' },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's mimeType", () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          qualifierPath: '/10/12345678901234567890/22/ABCDE',
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
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
              mimeType: 'invalid', // invalid mime type
            },
          ],
        })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.mimeType',
              message: 'mimeType is not in the list of allowed values',
            },
          ]);
        });
    });
  });

  it('delete namespace', async () => {
    await request(baseUrl)
      .delete('/api/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .query({ namespace: gs1 })
      .expect(HttpStatus.OK);
  });
});
