import { HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';

const baseUrl = process.env.RESOLVER_DOMAIN;
const environment = process.env.NODE_ENV;

// Define namespaces for e2e testing to avoid data pollution
const gs1 = `e2e-${environment}-mock-gs1`;
const integritySystems = `e2e-${environment}-mock-integrity-systems`;

describe('IdentifierManagementController (e2e)', () => {
  describe('/api/identifiers (POST)', () => {
    it('should create list of application identifiers for the namespace successfully', async () => {
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

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(identifierDto);

      // Cleanup;
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });
    it('should create list of application identifiers for the existing namespace successfully', async () => {
      const identifierDtoEmpty: IdentifierDto = {
        namespace: 'gs1',
        applicationIdentifiers: [],
      };
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
      // Create empty list first
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDtoEmpty)
        .expect(HttpStatus.OK);
      // Create actual list
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);
      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(identifierDto);

      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should override list of application identifiers for the namespace with existing application identifiers', async () => {
      const initialDto: IdentifierDto = {
        namespace: gs1,
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
      };
      const overrideDto: IdentifierDto = {
        namespace: gs1,
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
      // Create initial list
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(initialDto)
        .expect(HttpStatus.OK);
      // Override with new list
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(overrideDto)
        .expect(HttpStatus.OK);
      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: overrideDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(overrideDto);

      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: overrideDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should successfully create a list of application identifiers without extra fields when the request payload contains extra fields', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
      // Clone the payload the original identifierDto
      const extraFieldsPayload: any = structuredClone(identifierDto);
      // add extra unexpected fields to the payload
      extraFieldsPayload.unexpected = 'data'; // extra field
      extraFieldsPayload.applicationIdentifiers[0].unexpected = 'data'; // extra field

      const res = await request(baseUrl)
        .post('/api/identifiers')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(extraFieldsPayload) // send payload with extra fields
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(identifierDto); // extra fields should be ignored

      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should create list of application identifiers with namespaceURI and namespaceProfile qualifiers successfully', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
        namespaceURI: 'http://gs1.org/voc/',
        namespaceProfile: 'https://www.gs1.org/voc/?show=linktypes',
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

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(identifierDto);

      // Cleanup;
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should not create list of application identifiers with missing required fields', async () => {
      const identifierDto = {
        namespace: gs1,
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'gtin',
            qualifiers: ['10'],
            label: 'GTIN',
            title: 'Global Trade Item Number (GTIN)',
          },
          {
            shortcode: 'lot',
            type: 'Q',
            regex:
              '([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})',
            label: 'BATCH/LOT',
          },
        ],
      };
      const response = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errors).toEqual([
        {
          field: 'applicationIdentifiers.0.type',
          message: 'type is not in the list of allowed values',
        },
        {
          field: 'applicationIdentifiers.0.type',
          message: 'type must be a string',
        },
        {
          field: 'applicationIdentifiers.0.regex',
          message: 'regex should not be empty',
        },
        {
          field: 'applicationIdentifiers.0.regex',
          message: 'regex must be a string',
        },
        {
          field: 'applicationIdentifiers.1.title',
          message: 'title should not be empty',
        },
        {
          field: 'applicationIdentifiers.1.title',
          message: 'title must be a string',
        },
        {
          field: 'applicationIdentifiers.1.ai',
          message: 'ai must be a string',
        },
        {
          field: 'applicationIdentifiers.1.ai',
          message: 'ai should not be empty',
        },
      ]);
    });

    it('should return 400 for empty string fields', async () => {
      const invalidIdentifierWithEmptyStrings: IdentifierDto = {
        namespace: '',
        applicationIdentifiers: [
          {
            title: '',
            label: '',
            shortcode: '',
            ai: '',
            type: '',
            qualifiers: [''],
            regex: '',
          },
        ],
      };

      return request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(invalidIdentifierWithEmptyStrings)
        .expect(400)
        .expect((res) => {
          expect(res.body.errors).toEqual([
            {
              field: 'applicationIdentifiers.0.title',
              message: 'title should not be empty',
            },
            {
              field: 'applicationIdentifiers.0.label',
              message: 'label should not be empty',
            },
            {
              field: 'applicationIdentifiers.0.shortcode',
              message: 'shortcode should not be empty',
            },
            {
              field: 'applicationIdentifiers.0.ai',
              message: 'ai should not be empty',
            },
            {
              field: 'applicationIdentifiers.0.type',
              message: 'type is not in the list of allowed values',
            },
            {
              field: 'applicationIdentifiers.0.regex',
              message: 'regex should not be empty',
            },
            { field: 'namespace', message: 'namespace should not be empty' },
          ]);
        });
    });

    it('should not create list of application identifiers with invalid application identifier type', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'gtin',
            type: 'invalid_type',
            title: 'Global Trade Item Number (GTIN)',
            label: 'GTIN',
            regex: '(\\d{12,14}|\\d{8})',
            qualifiers: [],
          },
        ],
      };
      const response = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errors).toEqual([
        {
          message: 'type is not in the list of allowed values',
          field: 'applicationIdentifiers.0.type',
        },
      ]);
    });

    it('should not create list of application identifiers with qualifiers not appearing in the list of application identifiers', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'gtin',
            type: 'I',
            title: 'Global Trade Item Number (GTIN)',
            label: 'GTIN',
            regex: '(\\d{12,14}|\\d{8})',
            qualifiers: ['invalid_qualifier'],
          },
        ],
      };
      const response = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.BAD_REQUEST);
      expect(response.body.errors).toEqual([
        {
          message:
            "Qualifier with AI or shortcode 'invalid_qualifier' not found",
          field: 'qualifiers',
        },
      ]);
    });

    it('should not create list of application identifiers with invalid regex pattern', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'gtin',
            type: 'I',
            title: 'Global Trade Item Number (GTIN)',
            label: 'GTIN',
            regex: '([a-zA-Z',
            qualifiers: [],
          },
        ],
      };
      const response = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.errors).toEqual([
        {
          message: "Invalid regex '([a-zA-Z'",
          field: 'regex',
        },
      ]);
    });
  });

  describe('/api/identifiers (GET)', () => {
    it('should retrieve all identifiers successfully', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
      };
      const secondIdentifierDto: IdentifierDto = {
        namespace: integritySystems,
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
      };
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);
      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(secondIdentifierDto)
        .expect(HttpStatus.OK);
      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining(identifierDto),
          expect.objectContaining(secondIdentifierDto),
        ]),
      );

      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);

      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: secondIdentifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should retrieve the identifier for the namespace successfully', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
      };

      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
      expect(response.body).toMatchObject(identifierDto);

      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('should return 400 if the list of application identifiers for the namespace does not exist', async () => {
      const namespace = 'non-existent-namespace';
      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        error: `Identifier with namespace '${namespace}' not found`,
      });
    });
  });

  describe('/api/identifiers (DELETE)', () => {
    it('should delete the created identifier', async () => {
      const identifierDto: IdentifierDto = {
        namespace: gs1,
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
      };

      await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      let response = await request(baseUrl)
        .delete(`/api/identifiers`)
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Application identifier deleted successfully',
      });

      response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${process.env.API_KEY}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        error: `Identifier with namespace '${gs1}' not found`,
      });
    });
  });
});
