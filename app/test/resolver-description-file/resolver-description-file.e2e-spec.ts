import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { gs1LinkTypes } from '../../src/modules/link-registration/constants/gs1-link-types';
import { untpLinkTypes } from '../../src/modules/link-registration/constants/untp-link-types';
import { APP_ROUTE_PREFIX } from '../../src/common/utils/config.utils';

const baseUrl = process.env.API_BASE_URL + APP_ROUTE_PREFIX;
const appName = process.env.APP_NAME;

describe('CommonController (e2e)', () => {
  describe('GET /.well-known/resolver', () => {
    it('should return resolver description with gs1 and untp link type vocabularies', async () => {
      const response = await request(baseUrl)
        .get('/.well-known/resolver')
        .expect(HttpStatus.OK);

      expect(response.body.name).toBe(appName);
      expect(response.body.supportedPrimaryKeys).toEqual(['all']);
      expect(response.body.supportedLinkType).toEqual([
        {
          namespace: 'http://gs1.org/voc/',
          prefix: 'gs1:',
          profile: expect.stringContaining('/voc/?show=linktypes'),
        },
        {
          namespace: 'https://vocabulary.uncefact.org/untp/linkType#',
          prefix: 'untp:',
          profile: expect.stringContaining('/voc/?show=linktypes'),
        },
      ]);
    });
  });

  describe('GET /voc', () => {
    it('should redirect to /voc/?show=linktypes', async () => {
      const response = await request(baseUrl)
        .get('/voc')
        .expect(HttpStatus.FOUND);

      expect(response.header.location).toBe('/voc/?show=linktypes');
    });

    it('should return link types grouped by prefix', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        gs1: gs1LinkTypes,
        untp: untpLinkTypes,
      });
    });

    it('should return only gs1 link types when prefix=gs1', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes&prefix=gs1')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        gs1: gs1LinkTypes,
      });
    });

    it('should return only untp link types when prefix=untp', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes&prefix=untp')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        untp: untpLinkTypes,
      });
    });

    it('should return empty object for unknown prefix', async () => {
      const response = await request(baseUrl)
        .get('/voc/?show=linktypes&prefix=unknown')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({});
    });
  });

  describe('GET /voc/:linktype', () => {
    it('should return a specific gs1 link type', async () => {
      const response = await request(baseUrl)
        .get('/voc/epcis')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(gs1LinkTypes['epcis']);
    });

    it('should return a specific untp link type', async () => {
      const response = await request(baseUrl)
        .get('/voc/dpp')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(untpLinkTypes['dpp']);
    });

    it('should return error for invalid link type', async () => {
      await request(baseUrl).get('/voc/unknown').expect(HttpStatus.BAD_REQUEST);
    });
  });
});
