import { VersionHistoryEntry } from '../../link-resolution/interfaces/uri.interface';
import { LinkSetInput } from '../interfaces/link-set.interface';
import { constructLinkSetJson } from './link-set.utils';

describe('Link Set Utils', () => {
  describe('constructLinkSetJson', () => {
    it('should construct the LinkSet JSON correctly', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com',
            title: 'example',
            linkType: 'idr:exampleLinkType',
            hreflang: ['en'],
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example.com',
            title: 'example2',
            linkType: 'idr:exampleLinkType',
            hreflang: ['vi'],
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example2.com',
            title: 'example2',
            linkType: 'idr:exampleLinkType',
            hreflang: ['en'],
            context: 'au',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example3.com',
            title: 'example3',
            linkType: 'idr:exampleLinkType2',
            hreflang: ['en'],
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: true,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
          {
            targetUrl: 'https://example4.com',
            title: 'example4',
            linkType: 'idr:exampleLinkType2',
            hreflang: [],
            context: '',
            mimeType: '',
            active: true,
            fwqs: true,
            defaultLinkType: true,
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
        description: 'example',
        'https://linktypevoc.example.com/voc/exampleLinkType': [
          {
            href: 'https://example2.com',
            title: 'example2',
            type: 'application/json',
            hreflang: ['en'],
          },
          {
            href: 'https://example.com',
            title: 'example',
            type: 'application/json',
            hreflang: ['en'],
          },
        ],
        'https://linktypevoc.example.com/voc/exampleLinkType2': [
          {
            href: 'https://example4.com',
            title: 'example4',
            type: '',
            hreflang: [],
          },
          {
            href: 'https://example3.com',
            title: 'example3',
            type: 'application/json',
            hreflang: ['en'],
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

    it('should include description in the linkset context object', () => {
      const result = constructLinkSetJson(
        {
          namespace: 'idr',
          identificationKeyType: 'test',
          identificationKey: '12345',
          description: 'example',
          qualifierPath: '/',
          active: true,
          responses: [],
        },
        'gtin',
        {
          resolverDomain: 'https://resolver.example.com',
          linkTypeVocDomain: 'https://linktypevoc.example.com/voc',
        },
      );
      expect(result.description).toBe('example');
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
            encryptionMethod: 'AES-256',
            accessRole: [
              'untp:accessRole#Customer',
              'untp:accessRole#Regulator',
            ],
            method: 'POST',
            public: true,
            rel: ['edit', 'latest-version'],
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
      expect(linkTargets[0].public).toBe(true);
      expect(linkTargets[0].rel).toEqual(['edit', 'latest-version']);
      expect(linkTargets[0].hreflang).toEqual(['en']);
    });

    it.each([true, false])(
      'should emit `public: %s` when explicitly set on response',
      (publicValue) => {
        const uri: LinkSetInput = {
          namespace: 'idr',
          identificationKeyType: 'test',
          identificationKey: '12345',
          description: 'example',
          qualifierPath: '/',
          active: true,
          responses: [
            {
              linkType: 'gs1:certificationInfo',
              targetUrl: 'https://example.com/cert',
              title: 'Certification',
              mimeType: 'application/json',
              hreflang: ['en'],
              context: 'us',
              active: true,
              fwqs: false,
              defaultLinkType: true,
              defaultContext: true,
              defaultMimeType: true,
              public: publicValue,
            },
          ],
        };

        const result = constructLinkSetJson(uri, '01', attrs);
        const linkTargets =
          result['https://linktypevoc.example.com/voc/certificationInfo'];

        expect(linkTargets[0].public).toBe(publicValue);
      },
    );

    it('should omit UNTP properties when not present on response', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
      expect(linkTargets[0]).not.toHaveProperty('public');
      expect(linkTargets[0]).not.toHaveProperty('rel');
      expect(linkTargets[0].hreflang).toEqual([]);
    });

    it('should emit an empty `hreflang` array when explicitly set on the variant', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: [],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
      };

      const result = constructLinkSetJson(uri, '01', attrs);
      const linkTargets =
        result['https://linktypevoc.example.com/voc/certificationInfo'];

      expect(linkTargets[0].hreflang).toEqual([]);
    });

    it('should keep publisher-set rel separate from server-derived predecessor-version', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
            rel: ['edit'],
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

      const current = linkTypeEntries.find(
        (e: any) => e.href === 'https://example.com/cert',
      );
      const predecessor = linkTypeEntries.find(
        (e: any) => e.href === 'https://example.com/old-cert',
      );

      expect(current.rel).toEqual(['edit']);
      expect(predecessor.rel).toEqual(['predecessor-version']);
    });

    it('should include predecessor-version entries from version history', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
      expect(predecessors[0].rel).toEqual(['predecessor-version']);
    });

    it('should not include predecessor-version when history has no previousTargetUrl', () => {
      const uri: LinkSetInput = {
        namespace: 'idr',
        identificationKeyType: 'test',
        identificationKey: '12345',
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert-v3',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
        description: 'example',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            linkId: 'link1',
            linkType: 'gs1:certificationInfo',
            targetUrl: 'https://example.com/cert',
            title: 'Certification',
            mimeType: 'application/json',
            hreflang: ['en'],
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
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
    });
  });
});
