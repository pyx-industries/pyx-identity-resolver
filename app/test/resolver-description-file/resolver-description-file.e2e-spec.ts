/* eslint-disable @typescript-eslint/no-unused-vars */
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { IdentifierDto } from '../../src/modules/identifier-management/dto/identifier.dto';
import { defaultLinkTypes } from '../../src/modules/common/data/default-link-types';

const baseUrl = process.env.RESOLVER_DOMAIN;
const appName = process.env.APP_NAME;
const apiKey = process.env.API_KEY;

const environment = process.env.NODE_ENV;
const gs1 = `e2e-${environment}-mock-gs1`;

const namespaceURI = `${baseUrl}/voc/`;
const namespaceProfile = `${baseUrl}/voc/?show=linktypes`;

describe('CommonController (e2e)', () => {
  describe('namespace with namespaceProfile and namespaceURI', () => {
    let identifier: string;
    const identifierDto: IdentifierDto = {
      namespace: gs1,
      namespaceProfile: namespaceProfile,
      namespaceURI: namespaceURI,
      applicationIdentifiers: [],
    };

    it('should create the namespace successfully', async () => {
      const res = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(identifierDto);

      identifier = response.body.namespace;
    });

    it('GET /.well-known/resolver', async () => {
      const response = await request(baseUrl)
        .get('/.well-known/resolver')
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(appName);
      expect(response.body.supportedLinkType).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            namespace: namespaceURI,
            prefix: `${gs1}:`,
            profile: namespaceProfile,
          }),
        ]),
      );

      expect(response.body.supportedLinkType).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            namespace: `${baseUrl}/voc/`,
            prefix: `${gs1}:`,
            profile: `${baseUrl}/voc/?show=linktypes`,
          }),
        ]),
      );
      // Cleanup
      await request(baseUrl)
        .delete('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);
    });

    it('GET /voc', async () => {
      const response = await request(baseUrl)
        .get('/voc')
        .expect(HttpStatus.FOUND);

      expect(response.header.location).toBe('/voc/?show=linktypes');
    });

    it('GET /voc/?show=linktypes', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(defaultLinkTypes);
    });

    it('GET /voc/:linktype', async () => {
      const response = await request(baseUrl)
        .get('/voc/epcis')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(defaultLinkTypes.epcis);
    });
  });

  describe('namespace without namespaceProfile and namespaceURI', () => {
    let identifier: string;
    const identifierDto: IdentifierDto = {
      namespace: gs1,
      namespaceProfile: '',
      namespaceURI: '',
      applicationIdentifiers: [],
    };

    it('should create the namespace successfully', async () => {
      const res = await request(baseUrl)
        .post('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(identifierDto)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual({
        message: 'Application identifier upserted successfully',
      });

      const response = await request(baseUrl)
        .get('/api/identifiers')
        .set('Authorization', `Bearer ${apiKey}`)
        .query({ namespace: identifierDto.namespace })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(identifierDto);

      identifier = response.body.namespace;
    });

    it('GET /.well-known/resolver', async () => {
      const response = await request(baseUrl)
        .get('/.well-known/resolver')
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(appName);
      expect(response.body.supportedLinkType).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            namespace: namespaceURI,
            prefix: `${gs1}:`,
            profile: namespaceProfile,
          }),
        ]),
      );

      expect(response.body.supportedLinkType).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            namespace: `${baseUrl}/voc/`,
            prefix: `${gs1}:`,
            profile: `${baseUrl}/voc/?show=linktypes`,
          }),
        ]),
      );
    });

    it('GET /voc', async () => {
      const response = await request(baseUrl)
        .get('/voc')
        .expect(HttpStatus.FOUND);

      expect(response.header.location).toBe('/voc/?show=linktypes');
    });

    it('GET /voc/?show=linktypes', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(defaultLinkTypes);
    });

    it('GET /voc/:linktype', async () => {
      const response = await request(baseUrl)
        .get('/voc/epcis')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(defaultLinkTypes.epcis);
    });

    it('should throw error when GET /voc/:invalidLinktype', async () => {
      await request(baseUrl).get('/voc/unknown').expect(HttpStatus.BAD_REQUEST);
    });
  });
});
