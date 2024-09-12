import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { mockUris } from '../mock-factories/uri.factory';
import { IRepositoryProvider } from '../../src/repository/providers/provider.repository.interface';

describe('LinkResolutionController (e2e)', () => {
  let app: INestApplication;
  let repositoryProvider: IRepositoryProvider;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    repositoryProvider =
      moduleFixture.get<IRepositoryProvider>('RepositoryProvider');
    await app.init();
  });

  describe('/idr/01/09359502000041 (GET) with default responses are set', () => {
    beforeAll(async () => {
      await mockUris(repositoryProvider);
    });

    it('when linkType is idr:certificationInfo language is en, context is US, and mimeType is application/json', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'http://example-json.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is US, and mimeType is text/html', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept', 'text/html')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'http://example-html.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is AU, and mimeType is application/json', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect('Location', 'http://example-json.com.au')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is AU, and mimeType is text/html', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept', 'text/html')
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect('Location', 'http://example-html.com.au')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is US, and mimeType is unknown', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'http://example-html.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is unknown, and mimeType is unknown', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .set('Accept-Language', 'en')
        .expect(302)
        .expect('Location', 'http://example-html.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=idr:certificationInfo')
        .expect(302)
        .expect('Location', 'http://example-html.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is unknown, language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041')
        .expect(302)
        .expect('Location', 'http://example-html.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is all', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000041?linkType=all')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('linkset');
          expect(res.body.linkset.anchor).toBe(
            'http://localhost:3000/01/09359502000041',
          );
        })
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });
  });

  describe('/idr/01/09359502000042 (GET) with no default responses set', () => {
    it('when linkType is unknown language is unknown, context is unknown, and mimeType is unknown', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000042')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Cannot resolve link resolver');
        });
    });

    it('when linkType is idr:certificationInfo language is en, context is AU, and mimeType is application/json, the response fwqs is set true', () => {
      return request(app.getHttpServer())
        .get(
          '/idr/01/09359502000042?linkType=idr:certificationInfo&query1=1&query2=2',
        )
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-AU')
        .expect(302)
        .expect(
          'Location',
          'http://example-json.com.au?linkType=idr:certificationInfo&query1=1&query2=2',
        )
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });

    it('when linkType is idr:certificationInfo language is en, context is US, and mimeType is application/json, it should redirect to the active link', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000042?linkType=idr:certificationInfo')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-US')
        .expect(302)
        .expect('Location', 'http://example-html-active.com')
        .expect(
          'Link',
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
        );
    });
  });

  describe('/idr/01/09359502000043 (GET) with no active uri', () => {
    it('when linkType is idr:certificationInfo language is en, context is AU, and mimeType is application/json', () => {
      return request(app.getHttpServer())
        .get('/idr/01/09359502000043?linkType=idr:certificationInfo')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-AU')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Cannot resolve link resolver');
        });
    });
  });

  describe('invalid URI', () => {
    it('when id is invalid', () => {
      return request(app.getHttpServer())
        .get('/idr/01/invalid_id')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Cannot resolve link resolver');
        });
    });

    it('when primaryIdentifier is invalid', () => {
      return request(app.getHttpServer())
        .get('/idr/invalid/09359502000042')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Cannot resolve link resolver');
        });
    });

    it('when namespace is invalid', () => {
      return request(app.getHttpServer())
        .get('/invalid/01/09359502000042')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Cannot resolve link resolver');
        });
    });
  });
});
