import { processUri } from './link-resolution.utils';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import {
  ResolvedLink,
  ResolutionContext,
} from '../interfaces/link-resolution.interface';
import { Uri } from '../interfaces/uri.interface';

describe('Link Resolution Utils', () => {
  describe('processUri', () => {
    let uri: Uri;

    const defaultContext: ResolutionContext = {
      identificationKeyCode: '01',
      resolverDomain: 'https://id.idr.org',
      linkTypeVocDomain: 'https://idr.com/voc',
      namespace: 'idr',
      identificationKey: '9359502000041',
      qualifierPath: '/',
      linkHeaderMaxSize: 8192,
    };

    beforeEach(() => {
      uri = {
        id: 'idr/01/09359502000041',
        namespace: 'idr',
        identificationKeyType: 'gtin',
        identificationKey: '9359502000041',
        itemDescription: 'DPP',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'http://example-json.com.au',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            ianaLanguage: 'en',
            context: 'au',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: false,
          },
          {
            targetUrl: 'http://example-html.com.au',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            ianaLanguage: 'en',
            context: 'au',
            mimeType: 'text/html',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: true,
          },
          {
            targetUrl: 'http://example-json.com',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: false,
          },
          {
            targetUrl: 'http://example-html.com',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'text/html',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
        linkset: {
          anchor: 'http://localhost:3000/01/09359502000041',
          itemDescription: 'Passport',
          'https://idr.com/voc/defaultLink': [
            {
              href: 'http://example-json.com',
              title: 'Passport',
            },
          ],
          'https://idr.com/voc/defaultLinkMulti': [
            {
              href: 'http://example-html.com',
              title: 'Passport',
              type: 'text/html',
              hreflang: ['en'],
            },
            {
              href: 'http://example-html.com.au',
              title: 'Passport',
              type: 'text/html',
              hreflang: ['en'],
            },
          ],
          'https://idr.com/voc/certificationInfo': [
            {
              href: 'http://example-json.com',
              title: 'Passport',
              type: 'application/json',
              hreflang: ['en'],
            },
            {
              href: 'http://example-html.com',
              title: 'Passport',
              type: 'text/html',
              hreflang: ['en'],
            },
            {
              href: 'http://example-json.com.au',
              title: 'Passport',
              type: 'application/json',
              hreflang: ['en'],
            },
            {
              href: 'http://example-html.com.au',
              title: 'Passport',
              type: 'text/html',
              hreflang: ['en'],
            },
          ],
        },
      };
    });

    it('should return linkSet when linkType is all', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'all',
        },
      };

      const result = processUri(uri, identifierParams, defaultContext);

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.mimeType).toBe('application/json');
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return undefined when linkType is all and linkset is undefined', () => {
      uri.linkset = undefined;
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'all',
        },
      };

      const result = processUri(uri, identifierParams, defaultContext);

      expect(result).toBeUndefined();
    });

    it('should return ResolvedLink when linkType idr:certificationInfo, mimeType is application/json, ianaLanguage is en, and context is au', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
          mimeTypes: ['application/json'],
          ianaLanguageContexts: [
            {
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        },
      };

      const result = processUri(
        uri,
        identifierParams,
        defaultContext,
      ) as ResolvedLink;

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
      expect(result.mimeType).toBe(uri.responses[0].mimeType);
      expect(result.fwqs).toBe(uri.responses[0].fwqs);
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return ResolvedLink when linkType idr:certificationInfo, mimeType is undefined, ianaLanguage is en, and context is au', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
          ianaLanguageContexts: [
            {
              ianaLanguage: 'en',
              context: 'au',
            },
          ],
        },
      };

      const result = processUri(
        uri,
        identifierParams,
        defaultContext,
      ) as ResolvedLink;

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.targetUrl).toBe(uri.responses[1].targetUrl);
      expect(result.mimeType).toBe(uri.responses[1].mimeType);
      expect(result.fwqs).toBe(uri.responses[1].fwqs);
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return ResolvedLink when linkType idr:certificationInfo, mimeType is undefined, ianaLanguage is en, and context is undefined', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
          ianaLanguageContexts: [
            {
              ianaLanguage: 'en',
            },
          ],
        },
      };

      const result = processUri(
        uri,
        identifierParams,
        defaultContext,
      ) as ResolvedLink;

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      expect(result.mimeType).toBe(uri.responses[3].mimeType);
      expect(result.fwqs).toBe(uri.responses[3].fwqs);
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return ResolvedLink when linkType idr:certificationInfo, mimeType is undefined, ianaLanguage is undefined, and context is undefined', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
        },
      };

      const result = processUri(
        uri,
        identifierParams,
        defaultContext,
      ) as ResolvedLink;

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      expect(result.mimeType).toBe(uri.responses[3].mimeType);
      expect(result.fwqs).toBe(uri.responses[3].fwqs);
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return ResolvedLink when linkType is undefined, mimeType is undefined, ianaLanguage is undefined, and context is undefined', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {},
      };

      const result = processUri(
        uri,
        identifierParams,
        defaultContext,
      ) as ResolvedLink;

      expect(result.data).toEqual({ linkset: [uri.linkset] });
      expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      expect(result.mimeType).toBe(uri.responses[3].mimeType);
      expect(result.fwqs).toBe(uri.responses[3].fwqs);
      expect(result.linkHeaderText).toBeDefined();
      expect(result.linkHeaderTextFull).toBeDefined();
    });

    it('should return undefined when linkType is invalid', () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '9359502000041',
            qualifier: 'gtin',
          },
        },
        descriptiveAttributes: {
          linkType: 'invalid',
        },
      };

      const result = processUri(uri, identifierParams, defaultContext);

      expect(result).toBeUndefined();
    });

    describe('processUri with reconstructionContext', () => {
      const reconstructionContext: ResolutionContext = {
        identificationKeyCode: '01',
        resolverDomain: 'http://localhost:3002/api/1.0.0',
        linkTypeVocDomain: 'http://localhost:3002/api/1.0.0/voc',
        namespace: 'idr',
        identificationKey: '9359502000041',
        qualifierPath: '/',
        linkHeaderMaxSize: 8192,
      };

      const expectedRebuiltAnchor =
        'http://localhost:3002/api/1.0.0/idr/01/9359502000041';

      it('should rebuild linkset from responses when linkType is all', () => {
        const identifierParams: LinkResolutionDto = {
          namespace: 'idr',
          identifiers: {
            primary: {
              id: '9359502000041',
              qualifier: 'gtin',
            },
          },
          descriptiveAttributes: {
            linkType: 'all',
          },
        };

        const accessRoleContext: ResolutionContext = {
          ...reconstructionContext,
          accessRole: 'customer',
        };

        const result = processUri(uri, identifierParams, accessRoleContext);

        expect(result).toBeDefined();
        expect(result.mimeType).toBe('application/json');
        expect(result.data.linkset[0].anchor).toBe(expectedRebuiltAnchor);
        // The rebuilt anchor should differ from the pre-stored one
        expect(result.data.linkset[0].anchor).not.toBe(uri.linkset.anchor);
      });

      it('should return resolved link with rebuilt linkset for a specific linkType', () => {
        const identifierParams: LinkResolutionDto = {
          namespace: 'idr',
          identifiers: {
            primary: {
              id: '9359502000041',
              qualifier: 'gtin',
            },
          },
          descriptiveAttributes: {
            linkType: 'idr:certificationInfo',
            mimeTypes: ['application/json'],
            ianaLanguageContexts: [
              {
                ianaLanguage: 'en',
                context: 'au',
              },
            ],
          },
        };

        const accessRoleContext: ResolutionContext = {
          ...reconstructionContext,
          accessRole: 'customer',
        };

        const result = processUri(
          uri,
          identifierParams,
          accessRoleContext,
        ) as ResolvedLink;

        expect(result).toBeDefined();
        expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
        expect(result.mimeType).toBe(uri.responses[0].mimeType);
        expect(result.data.linkset[0].anchor).toBe(expectedRebuiltAnchor);
        // The rebuilt anchor should differ from the pre-stored one
        expect(result.data.linkset[0].anchor).not.toBe(uri.linkset.anchor);
      });

      it('should return undefined when linkType is all and responses are empty', () => {
        uri.responses = [];
        const identifierParams: LinkResolutionDto = {
          namespace: 'idr',
          identifiers: {
            primary: {
              id: '9359502000041',
              qualifier: 'gtin',
            },
          },
          descriptiveAttributes: {
            linkType: 'all',
          },
        };

        const result = processUri(uri, identifierParams, reconstructionContext);

        expect(result).toBeUndefined();
      });

      it('should return undefined when linkType is all and all responses are inactive', () => {
        uri.responses = uri.responses.map((response) => ({
          ...response,
          active: false,
        }));
        const identifierParams: LinkResolutionDto = {
          namespace: 'idr',
          identifiers: {
            primary: {
              id: '9359502000041',
              qualifier: 'gtin',
            },
          },
          descriptiveAttributes: {
            linkType: 'all',
          },
        };

        const result = processUri(uri, identifierParams, reconstructionContext);

        expect(result).toBeUndefined();
      });
    });
  });
});
