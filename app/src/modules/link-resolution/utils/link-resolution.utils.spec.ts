import { processUri } from './link-resolution.utils';
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import { Uri } from '../interfaces/uri.interface';

describe('Link Resolution Utils', () => {
  describe('processUri', () => {
    let uri: Uri;
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
        linkHeaderText:
          '<http://example-json.com>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <http://example-json.com.au>; rel="idr:certificationInfo"; type="application/json"; hreflang="en"; title="Passport", <http://example-html.com.au>; rel="idr:certificationInfo"; type="text/html"; hreflang="en"; title="Passport", <https://id.idr.org/01/09359502000041>; rel="owl:sameAs"',
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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: { linkset: [uri.linkset] },
        mimeType: 'application/json',
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: {
          linkset: [uri.linkset],
        },
        targetUrl: uri.responses[0].targetUrl,
        mimeType: uri.responses[0].mimeType,
        fwqs: uri.responses[0].fwqs,
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: {
          linkset: [uri.linkset],
        },
        targetUrl: uri.responses[1].targetUrl,
        mimeType: uri.responses[1].mimeType,
        fwqs: uri.responses[1].fwqs,
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: {
          linkset: [uri.linkset],
        },
        targetUrl: uri.responses[3].targetUrl,
        mimeType: uri.responses[3].mimeType,
        fwqs: uri.responses[3].fwqs,
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: {
          linkset: [uri.linkset],
        },
        targetUrl: uri.responses[3].targetUrl,
        mimeType: uri.responses[3].mimeType,
        fwqs: uri.responses[3].fwqs,
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

      expect(result).toEqual({
        data: { linkset: [uri.linkset] },
        targetUrl: uri.responses[3].targetUrl,
        mimeType: uri.responses[3].mimeType,
        fwqs: uri.responses[3].fwqs,
        linkHeaderText: uri.linkHeaderText,
      });
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

      const result = processUri(uri, identifierParams);

      expect(result).toBeUndefined();
    });
  });
});
