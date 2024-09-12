import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { IRepositoryProvider } from '../../src/repository/providers/provider.repository.interface';

const baseUrl = process.env.APP_ENDPOINT;
const environment = process.env.ENVIRONMENT;

// Define namespaces for e2e testing to avoid data pollution
const gs1 = `e2e-${environment}-mock-gs1`;

describe('LinkResolutionController (e2e)', () => {
  let app: INestApplication;
  let repositoryProvider: IRepositoryProvider;

  beforeAll(async () => {
    // Creates a testing module for the AppModule.
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Get the INestApplication and the IRepositoryProvider instance from the testing module.
    app = module.createNestApplication();

    repositoryProvider = module.get<IRepositoryProvider>('RepositoryProvider');

    // Initialize the application.
    await app.init();
  });

  beforeEach(async () => {
    // Reset the repository before each test.
    await repositoryProvider.save({
      id: 'identifiers.json',
      [gs1]: {
        namespace: gs1,
        applicationIdentifiers: [
          {
            title: 'Serial Shipping Container Code (SSCC) ',
            label: 'SSCC',
            shortcode: 'sscc',
            ai: '00',
            format: 'N18',
            type: 'I',
            regex: '(\\d{18})',
          },
          {
            title: 'Global Trade Item Number (GTIN)',
            label: 'GTIN',
            shortcode: 'gtin',
            ai: '01',
            format: 'N14',
            type: 'I',
            qualifiers: ['22', '10', '3101', '13', '21'],
            regex: '(\\d{12,14}|\\d{8})',
          },
          {
            title: 'Consumer product variant',
            label: 'CPV',
            shortcode: 'cpv',
            ai: '22',
            format: 'N2+X..20',
            type: 'Q',
            regex: '([!%-?A-Z_a-z\\x22]{1,20})',
          },
          {
            title: 'Batch or lot number',
            label: 'BATCH/LOT',
            shortcode: 'batch/lot',
            ai: '10',
            format: 'N2+X..20',
            type: 'Q',
            regex: '([!%-?A-Z_a-z\\x22]{1,20})',
          },
          {
            title: 'NET WEIGHT (kg)',
            label: 'NET WEIGHT (kg)',
            shortcode: 'NET WEIGHT (kg)',
            ai: '3101',
            format: 'N4+N6',
            type: 'Q',
            regex: '(\\d{6})',
          },
          {
            title: 'Packaging date (YYMMDD)',
            label: 'PACK DATE',
            shortcode: 'PACK DATE',
            ai: '13',
            format: 'N2+N6',
            type: 'Q',
            regex: '(\\d{2}(?:0\\d|1[0-2])(?:[0-2]\\d|3[01]))',
          },
          {
            title: 'Serial number',
            label: 'SERIAL',
            shortcode: 'SERIAL',
            ai: '21',
            format: 'N2+X..20',
            type: 'Q',
            regex: '([!%-?A-Z_a-z\\x22]{1,20})',
          },
        ],
      },
    });
  });

  // Test the POST /api/resolver endpoint
  describe('/api/resolver (POST)', () => {
    it('should register a new link resolver with valid payload', () => {
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });
    });

    it('should register a new link resolver when missing the qualifierPath', () => {
      return request(baseUrl)
        .post('/api/resolver')
        .send({
          namespace: gs1,
          identificationKeyType: 'gtin',
          identificationKey: '12345678901234',
          // missing qualifierPath
          itemDescription: 'DPP',
          active: true,
          responses: [
            {
              defaultLinkType: true,
              defaultMimeType: true,
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(201)
        .expect({
          message: 'Link resolver registered successfully',
        });
    });

    it('should throw an error if namespace is not found', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            { field: 'namespace', message: 'namespace should not be empty' },
            { field: 'namespace', message: 'namespace must be a string' },
          ]);
        });
    });

    it('should throw an error if identificationKeyType is not found', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error if identificationKey is not found', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error if itemDescription is not found', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error if active is not found', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'active',
              message: 'errors.isBoolean',
            },
          ]);
        });
    });

    it('should throw an error if responses is not found', () => {
      return request(baseUrl)
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
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses',
              message: 'errors.arrayNotEmpty',
            },
            {
              field: 'responses',
              message: 'errors.isArray',
            },
          ]);
        });
    });

    it('should throw a bad request error for invalid active', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'active',
              message: 'errors.isBoolean',
            },
          ]);
        });
    });

    it('should throw an error if qualifier path are present but not in the identifier qualifiers', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error if the qualifier value does not match the regex', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error for invalid identificationKeyType', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error for invalid identificationKey', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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

    it('should throw an error for invalid qualifierPath', () => {
      return request(baseUrl)
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'responses',
              message: 'errors.arrayNotEmpty',
            },
            {
              field: 'responses',
              message: 'errors.isArray',
            },
            {
              field: 'responses',
              message: 'errors.nestedValidation',
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'defaultLinkType',
              message: 'errors.isBoolean',
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'defaultMimeType',
              message: 'errors.isBoolean',
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
              fwqs: 'invalid', // invalid fwqs
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'fwqs',
              message: 'errors.isBoolean',
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
              fwqs: false,
              active: 'invalid', // invalid active
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'active',
              message: 'errors.isBoolean',
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
              fwqs: false,
              active: true,
              linkType: 'invalid', // invalid link type
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'linkType',
              message: 'linkType is not in the list of allowed values',
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: '', // invalid link title
              targetUrl: 'http://example.com',
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            { field: 'linkTitle', message: 'linkTitle should not be empty' },
          ]);
        });
    });

    it("should throw a bad request error for invalid response's targetUrl", () => {
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'invalid', // invalid target URL
              mimeType: 'text/html',
            },
          ],
        })
        .set('Accept', 'application/json')
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
              fwqs: false,
              active: true,
              linkType: 'dlr:certificationInfo',
              linkTitle: 'DPP',
              targetUrl: 'http://example.com',
              mimeType: 'invalid', // invalid mime type
            },
          ],
        })
        .set('Accept', 'application/json')
        .expect(400)
        .expect((res) => {
          expect(res.body.path).toBe('/api/resolver');
          expect(res.body.errors).toEqual([
            {
              field: 'mimeType',
              message: 'mimeType is not in the list of allowed values',
            },
          ]);
        });
    });
  });
});
