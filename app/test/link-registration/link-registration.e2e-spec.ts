import { HttpStatus } from '@nestjs/common';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';
import { IdentifierDto } from 'src/modules/identifier-management/dto/identifier.dto';
import request from 'supertest';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const environment = process.env.NODE_ENV;
const apiKey = process.env.API_KEY;

// Define namespaces for e2e testing to avoid data pollution
const gs1 = `e2e-${environment}-mock-gs1`;

describe('LinkResolutionController (e2e)', () => {
  describe('/resolver (POST)', () => {
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
        .post('/identifiers')
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
        .post('/resolver')
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
        .post('/resolver')
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
        .post('/resolver')
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
        .post('/resolver')
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
        .expect((res) => {
          const link = res.headers['link'];
          expect(link).toContain('rel="owl:sameAs"');
          expect(link).toContain('rel="linkset"');
          expect(link).toContain(`rel="${namespace}:epcis"`);
          expect(link).toContain('https://example-epics.com');
        });
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
        .post('/resolver')
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
      // Should return 409 Conflict due to duplicate response detection
      await request(baseUrl)
        .post('/resolver')
        .send(
          resolverPayload(
            'certificationInfo',
            'Certification Information',
            'https://example.com',
          ),
        )
        .set(headers)
        .expect(409)
        .expect((res) => {
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toContain(
            'Duplicate responses already exist',
          );
          expect(res.body.error).toBe('Conflict');
        });

      // Verify that only one link exists after duplicate registration
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}${qualifierPath}`,
        )
        .set('Accept', 'application/json')
        .expect(302)
        .expect((res) => {
          const link = res.headers['link'];
          expect(link).toContain('rel="owl:sameAs"');
          expect(link).toContain('rel="linkset"');
          expect(link).toContain(`rel="${namespace}:certificationInfo"`);
          expect(link).toContain('https://example.com');
        });

      // cleanup
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace })
        .expect(HttpStatus.OK);
    });

    it('should throw an error if namespace is not found', async () => {
      await request(baseUrl)
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
          expect(res.body.errors).toEqual([
            { field: 'namespace', message: 'namespace should not be empty' },
            { field: 'namespace', message: 'namespace must be a string' },
          ]);
        });
    });

    it('should throw an error if identificationKeyType is not found', async () => {
      await request(baseUrl)
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
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
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
          expect(res.body.errors).toEqual([
            { field: 'targetUrl', message: 'errors.isUrl' },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's mimeType", () => {
      return request(baseUrl)
        .post('/resolver')
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
          expect(res.body.path).toBe(APP_ROUTE_PREFIX + '/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses.0.mimeType',
              message: 'mimeType is not in the list of allowed values',
            },
          ]);
        });
    });

    it('should auto-unset existing defaults when new response sets same defaults', async () => {
      // Create a unique namespace for this test
      const namespace = `e2e-${environment}-mock-auto-unset`;
      const identifierDto = createIdentifierDto();
      identifierDto.namespace = namespace;
      await registerIdentifier(identifierDto);

      const identificationKeyType = 'gtin';
      const identificationKey = '98765432109876';
      const qualifierPath = '/';

      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.API_KEY}`,
      };

      // Register first response with all defaults true
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace,
          identificationKeyType,
          identificationKey,
          itemDescription: 'Test Product',
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
              linkType: `${namespace}:certificationInfo`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'Response A - Original Default',
              targetUrl: 'https://response-a.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set(headers)
        .expect(201);

      // Register second response with different linkType and defaultLinkType: true
      // This should auto-unset the defaultLinkType on response A
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace,
          identificationKeyType,
          identificationKey,
          itemDescription: 'Test Product',
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
              linkType: `${namespace}:epcis`,
              ianaLanguage: 'fr',
              context: 'us',
              title: 'Response B - New Default LinkType',
              targetUrl: 'https://response-b.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set(headers)
        .expect(201);

      // Register third response with same linkType as A, defaultIanaLanguage: true
      // This should auto-unset the defaultIanaLanguage on response A
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace,
          identificationKeyType,
          identificationKey,
          itemDescription: 'Test Product',
          qualifierPath,
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: `${namespace}:certificationInfo`,
              ianaLanguage: 'fr',
              context: 'ca',
              title: 'Response C - New Default Language',
              targetUrl: 'https://response-c.com',
              mimeType: 'application/json',
            },
          ],
        })
        .set(headers)
        .expect(201);

      // Register fourth response with same linkType+language as A, defaultContext: true
      // This should auto-unset the defaultContext on response A
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace,
          identificationKeyType,
          identificationKey,
          itemDescription: 'Test Product',
          qualifierPath,
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: true,
              defaultIanaLanguage: false,
              defaultContext: true,
              fwqs: false,
              active: true,
              linkType: `${namespace}:certificationInfo`,
              ianaLanguage: 'en',
              context: 'gb',
              title: 'Response D - New Default Context',
              targetUrl: 'https://response-d.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set(headers)
        .expect(201);

      // Register fifth response with same full scope as A, defaultMimeType: true
      // This should auto-unset the defaultMimeType on response A
      await request(baseUrl)
        .post('/resolver')
        .send({
          namespace,
          identificationKeyType,
          identificationKey,
          itemDescription: 'Test Product',
          qualifierPath,
          active: true,
          responses: [
            {
              defaultLinkType: false,
              defaultMimeType: true,
              defaultIanaLanguage: false,
              defaultContext: false,
              fwqs: false,
              active: true,
              linkType: `${namespace}:certificationInfo`,
              ianaLanguage: 'en',
              context: 'au',
              title: 'Response E - New Default MimeType',
              targetUrl: 'https://response-e.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set(headers)
        .expect(201);

      // Verify by fetching with linkType=all to get the full linkset
      const res = await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}?linkType=all`,
        )
        .expect(200);

      const linkset = JSON.parse(res.text).linkset;
      expect(linkset).not.toBeNull();
      expect(linkset.length).toBeGreaterThan(0);

      // 1. Verify defaultLinkType: when no linkType is provided, it defaults to response B
      // (which has defaultLinkType: true)
      await request(baseUrl)
        .get(`/${namespace}/${identificationKeyType}/${identificationKey}`)
        .expect(302)
        .expect('Location', 'https://response-b.com');

      // 2. Verify defaultIanaLanguage: when linkType=certificationInfo but no language header,
      // it should resolve to response C (which has defaultIanaLanguage: true for certificationInfo)
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}?linkType=${encodeURIComponent(`${namespace}:certificationInfo`)}`,
        )
        .expect(302)
        .expect('Location', 'https://response-c.com');

      // 3. Verify defaultContext: when linkType=certificationInfo and language=en (no region),
      // it should resolve to response D (which has defaultContext: true for certificationInfo+en)
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}?linkType=${encodeURIComponent(`${namespace}:certificationInfo`)}`,
        )
        .set('Accept-Language', 'en')
        .expect(302)
        .expect('Location', 'https://response-d.com');

      // 4. Verify defaultMimeType: when linkType=certificationInfo, language=en-AU (full context),
      // but no Accept header, it should resolve to response E (which has defaultMimeType: true for certificationInfo+en+au)
      await request(baseUrl)
        .get(
          `/${namespace}/${identificationKeyType}/${identificationKey}?linkType=${encodeURIComponent(`${namespace}:certificationInfo`)}`,
        )
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect('Location', 'https://response-e.com');

      // cleanup
      await request(baseUrl)
        .delete('/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace })
        .expect(HttpStatus.OK);
    });
  });

  it('delete namespace', async () => {
    await request(baseUrl)
      .delete('/identifiers')
      .set('Authorization', `Bearer ${apiKey}`)
      .query({ namespace: gs1 })
      .expect(HttpStatus.OK);
  });
});
