import { VersionHistoryEntry } from '../../link-resolution/interfaces/uri.interface';
import { LinkSetInput } from '../interfaces/link-set.interface';
import { constructHTTPLink, constructLinkSetJson } from './link-set.utils';

describe('Link Set Utils', () => {
  describe('constructHTTPLink', () => {
    it('should construct the HTTP link correctly', () => {
      const uri: LinkSetInput = {
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
      const uri: LinkSetInput = {
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

  describe('UNTP linkset extensions', () => {
    const attrs = {
      resolverDomain: 'https://resolver.example.com',
      linkTypeVocDomain: 'https://linktypevoc.example.com/voc',
    };

    it('should include UNTP properties on link targets when present', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            encryptionMethod: 'AES-256',
            accessRole: [
              'untp:accessRole#Customer',
              'untp:accessRole#Regulator',
            ],
            method: 'POST',
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);
      const linkTargets =
        result['https://linktypevoc.example.com/voc/certificationInfo'];

      expect(linkTargets).toBeDefined();
      expect(linkTargets).toHaveLength(1);
      expect(linkTargets[0].encryptionMethod).toBe('AES-256');
      expect(linkTargets[0].accessRole).toEqual([
        'untp:accessRole#Customer',
        'untp:accessRole#Regulator',
      ]);
      expect(linkTargets[0].method).toBe('POST');
    });

    it('should omit UNTP properties when not present on response', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);
      const linkTargets =
        result['https://linktypevoc.example.com/voc/certificationInfo'];

      expect(linkTargets).toBeDefined();
      expect(linkTargets).toHaveLength(1);
      expect(linkTargets[0]).not.toHaveProperty('encryptionMethod');
      expect(linkTargets[0]).not.toHaveProperty('accessRole');
      expect(linkTargets[0]).not.toHaveProperty('method');
    });

    it('should include predecessor-version entries from version history', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const versionHistory: VersionHistoryEntry[] = [
        {
          version: 2,
          updatedAt: '2024-06-01T00:00:00.000Z',
          changes: [
            {
              linkId: 'link1',
              action: 'updated' as const,
              previousTargetUrl: 'https://example.com/old-cert',
            },
          ],
        },
      ];

      const result = constructLinkSetJson(uri, '01', attrs, versionHistory);

      const linkTypeEntries =
        result['https://linktypevoc.example.com/voc/certificationInfo'];
      expect(linkTypeEntries).toBeDefined();
      expect(linkTypeEntries).toHaveLength(2);

      const predecessors = linkTypeEntries.filter((e: any) =>
        e.rel?.includes('predecessor-version'),
      );
      expect(predecessors).toHaveLength(1);
      expect(predecessors[0].href).toBe('https://example.com/old-cert');
      expect(predecessors[0].title).toBe('Certification');
      expect(predecessors[0].type).toBe('application/json');
      expect(predecessors[0].hreflang).toEqual(['en']);
      expect(predecessors[0].rel).toEqual(['predecessor-version']);
    });

    it('should not include predecessor-version when history has no previousTargetUrl', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const versionHistory: VersionHistoryEntry[] = [
        {
          version: 1,
          updatedAt: '2024-05-01T00:00:00.000Z',
          changes: [
            {
              linkId: 'link1',
              action: 'created' as const,
            },
          ],
        },
      ];

      const result = constructLinkSetJson(uri, '01', attrs, versionHistory);

      const linkTypeEntries =
        result['https://linktypevoc.example.com/voc/certificationInfo'];
      const predecessors = linkTypeEntries.filter((e: any) =>
        e.rel?.includes('predecessor-version'),
      );
      expect(predecessors).toHaveLength(0);
    });

    it('should not include predecessor-version when versionHistory is omitted', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);

      const linkTypeEntries =
        result['https://linktypevoc.example.com/voc/certificationInfo'];
      const predecessors = linkTypeEntries.filter((e: any) =>
        e.rel?.includes('predecessor-version'),
      );
      expect(predecessors).toHaveLength(0);
    });

    it('should include encryptionMethod when value is "none"', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            encryptionMethod: 'none',
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);
      const linkTargets =
        result['https://linktypevoc.example.com/voc/certificationInfo'];

      expect(linkTargets).toBeDefined();
      expect(linkTargets).toHaveLength(1);
      expect(linkTargets[0].encryptionMethod).toBe('none');
    });

    it('should exclude empty arrays for accessRole and method', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            accessRole: [],
            method: undefined,
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);
      const linkTargets =
        result['https://linktypevoc.example.com/voc/certificationInfo'];

      expect(linkTargets).toBeDefined();
      expect(linkTargets).toHaveLength(1);
      expect(linkTargets[0]).not.toHaveProperty('accessRole');
      expect(linkTargets[0]).not.toHaveProperty('method');
    });

    it('should include multiple predecessor versions from multiple history entries', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert-v3',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const versionHistory: VersionHistoryEntry[] = [
        {
          version: 2,
          updatedAt: '2024-06-01T00:00:00.000Z',
          changes: [
            {
              linkId: 'link1',
              action: 'updated' as const,
              previousTargetUrl: 'https://example.com/cert-v1',
            },
          ],
        },
        {
          version: 3,
          updatedAt: '2024-07-01T00:00:00.000Z',
          changes: [
            {
              linkId: 'link1',
              action: 'updated' as const,
              previousTargetUrl: 'https://example.com/cert-v2',
            },
          ],
        },
      ];

      const result = constructLinkSetJson(uri, '01', attrs, versionHistory);

      const linkTypeEntries =
        result['https://linktypevoc.example.com/voc/certificationInfo'];
      expect(linkTypeEntries).toBeDefined();
      expect(linkTypeEntries).toHaveLength(3);

      const predecessors = linkTypeEntries.filter((e: any) =>
        e.rel?.includes('predecessor-version'),
      );
      expect(predecessors).toHaveLength(2);
      expect(predecessors[0].href).toBe('https://example.com/cert-v1');
      expect(predecessors[0].rel).toEqual(['predecessor-version']);
      expect(predecessors[1].href).toBe('https://example.com/cert-v2');
      expect(predecessors[1].rel).toEqual(['predecessor-version']);
    });

    it('should use historical metadata for predecessor-version entries', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        itemDescription: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const versionHistory: VersionHistoryEntry[] = [
        {
          version: 2,
          updatedAt: '2024-06-01T00:00:00.000Z',
          changes: [
            {
              linkId: 'link1',
              action: 'updated' as const,
              previousTargetUrl: 'https://example.com/old-cert',
              previousMimeType: 'text/html',
              previousIanaLanguage: 'fr',
            },
          ],
        },
      ];

      const result = constructLinkSetJson(uri, '01', attrs, versionHistory);

      const linkTypeEntries =
        result['https://linktypevoc.example.com/voc/certificationInfo'];
      expect(linkTypeEntries).toBeDefined();
      expect(linkTypeEntries).toHaveLength(2);

      const predecessors = linkTypeEntries.filter((e: any) =>
        e.rel?.includes('predecessor-version'),
      );
      expect(predecessors).toHaveLength(1);
      expect(predecessors[0].href).toBe('https://example.com/old-cert');
      expect(predecessors[0].rel).toEqual(['predecessor-version']);
      expect(predecessors[0].type).toBe('text/html');
      expect(predecessors[0].hreflang).toEqual(['fr']);
      expect(predecessors[0]['title*']).toEqual([
        { value: 'Certification', language: 'fr' },
      ]);
    });
  });
});
