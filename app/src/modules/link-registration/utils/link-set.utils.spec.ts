import { Uri } from '../../link-resolution/interfaces/uri.interface';
import { constructHTTPLink, constructLinkSetJson } from './link-set.utils';

describe('Link Set Utils', () => {
  describe('constructHTTPLink', () => {
    it('should construct the HTTP link correctly', () => {
      const uri: Uri = {
        id: '1',
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'example',
            linkType: 'idr:exampleLinkType',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example2.com',
            title: 'example2',
            linkType: 'idr:exampleLinkType2',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example3.com',
            title: 'example3',
            linkType: 'idr:exampleLinkType3',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const identificationKeyCode = '01';
      const attrs = {
        resolverDomain: 'https://resolver.example.com',
        linkTypeVocDomain: 'https://linktypevoc.example.com/voc',
      };

      const expectedLink =
        '<https://example.com>; rel="idr:exampleLinkType"; type="application/json"; hreflang="en"; title="example", <https://example2.com>; rel="idr:exampleLinkType2"; type="application/json"; hreflang="en"; title="example2", <https://example3.com>; rel="idr:exampleLinkType3"; type="application/json"; hreflang="en"; title="example3", <https://resolver.example.com/idr/01/12345>; rel="owl:sameAs"';
      const constructedLink = constructHTTPLink(
        uri,
        identificationKeyCode,
        attrs,
      );

      expect(constructedLink).toEqual(expectedLink);
    });
  });

  describe('constructLinkSetJson', () => {
    it('should construct the LinkSet JSON correctly', () => {
      const uri: Uri = {
        id: '1',
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'example',
            linkType: 'idr:exampleLinkType',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example.com',
            title: 'example2',
            linkType: 'idr:exampleLinkType',
            ianaLanguage: 'vi',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example2.com',
            title: 'example2',
            linkType: 'idr:exampleLinkType',
            ianaLanguage: 'en',
            context: 'au',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example3.com',
            title: 'example3',
            linkType: 'idr:exampleLinkType2',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example4.com',
            title: 'example4',
            linkType: 'idr:exampleLinkType2',
            ianaLanguage: '',
            context: '',
            mimeType: '',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };
      const identificationKeyCode = '01';
      const attrs = {
        resolverDomain: 'https://resolver.example.com',
        linkTypeVocDomain: 'https://linktypevoc.example.com/voc',
      };

      const expectedLinkSetJson = {
        anchor: 'https://resolver.example.com/idr/01/12345',
        'https://linktypevoc.example.com/voc/exampleLinkType': [
          {
            href: 'https://example2.com',
            hreflang: ['en'],
            title: 'example2',
            'title*': [{ language: 'en', value: 'example2' }],
            type: 'application/json',
          },
          {
            href: 'https://example.com',
            hreflang: ['en', 'vi'],
            title: 'example',
            'title*': [
              { language: 'en', value: 'example' },
              { language: 'vi', value: 'example2' },
            ],
            type: 'application/json',
          },
        ],
        'https://linktypevoc.example.com/voc/exampleLinkType2': [
          {
            href: 'https://example4.com',
            title: 'example4',
            hreflang: [],
            'title*': [],
            type: '',
          },
          {
            href: 'https://example3.com',
            title: 'example3',
            type: 'application/json',
            hreflang: ['en'],
            'title*': [{ language: 'en', value: 'example3' }],
          },
        ],
      };
      const constructedLinkSetJson = constructLinkSetJson(
        uri,
        identificationKeyCode,
        attrs,
      );

      expect(constructedLinkSetJson).toEqual(expectedLinkSetJson);
    });
  });
});
