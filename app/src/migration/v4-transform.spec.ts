import { migrateUriDocument } from './v4-transform';

const attrs = {
  resolverDomain: 'http://localhost:3000/api/4.0.0',
  linkTypeVocDomain: 'http://localhost:3000/api/4.0.0/voc',
};

const baseLegacyDoc = () => ({
  id: 'gs1/01/09359502000041',
  namespace: 'gs1',
  identificationKeyType: 'gtin',
  identificationKey: '09359502000041',
  description: 'DPP',
  qualifierPath: '/',
  active: true,
});

const baseLegacyResponse = (over: Record<string, unknown> = {}): any => ({
  targetUrl: 'https://example.com/cert',
  title: 'Certification Information',
  linkType: 'gs1:certificationInfo',
  context: 'us',
  mimeType: 'application/json',
  active: true,
  fwqs: false,
  defaultLinkType: true,
  defaultContext: true,
  defaultMimeType: true,
  linkId: 'lnk-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ianaLanguage: 'en',
  defaultIanaLanguage: true,
  ...over,
});

describe('migrateUriDocument', () => {
  describe('idempotency', () => {
    it('returns the input unchanged when no legacy field is present', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          {
            targetUrl: 'https://example.com/cert',
            title: 'Cert',
            linkType: 'gs1:certificationInfo',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
            hreflang: ['en-US', 'en'],
          },
        ],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [{ linkId: 'lnk-1', action: 'created' }],
          },
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.mutated).toBe(false);
      expect(outcome.outputResponseCount).toBe(1);
      expect(document).toBe(doc);
    });
  });

  describe('legacy single-language variants', () => {
    it('converts ianaLanguage into hreflang[] and strips legacy fields', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [baseLegacyResponse({ ianaLanguage: 'fr' })],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.mutated).toBe(true);
      expect(document.responses).toHaveLength(1);
      expect(document.responses[0]).not.toHaveProperty('ianaLanguage');
      expect(document.responses[0]).not.toHaveProperty('defaultIanaLanguage');
      expect(document.responses[0].hreflang).toEqual(['fr']);
    });

    it('preserves an existing hreflang[] and appends the legacy ianaLanguage', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            ianaLanguage: 'en',
            hreflang: ['en-US'],
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.responses[0].hreflang).toEqual(['en-US', 'en']);
    });

    it('deduplicates hreflang entries case-insensitively', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            ianaLanguage: 'EN',
            hreflang: ['en'],
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.responses[0].hreflang).toEqual(['en']);
    });
  });

  describe('4-tuple merge', () => {
    it('merges two legacy variants sharing the new 4-tuple', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-en',
            ianaLanguage: 'en',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
          baseLegacyResponse({
            linkId: 'lnk-fr',
            ianaLanguage: 'fr',
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.inputResponseCount).toBe(2);
      expect(outcome.outputResponseCount).toBe(1);
      expect(document.responses[0].linkId).toBe('lnk-en');
      expect(document.responses[0].hreflang).toEqual(['en', 'fr']);
    });

    it('first-registered (by createdAt) wins when metadata diverges', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-old',
            title: 'Original title',
            ianaLanguage: 'en',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
          baseLegacyResponse({
            linkId: 'lnk-new',
            title: 'Newer title',
            ianaLanguage: 'fr',
            createdAt: '2026-02-01T00:00:00.000Z',
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.responses[0].linkId).toBe('lnk-old');
      expect(document.responses[0].title).toBe('Original title');
    });

    it('falls back to array order when createdAt is missing on a variant', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-no-ts-a',
            ianaLanguage: 'en',
            createdAt: undefined,
          }),
          baseLegacyResponse({
            linkId: 'lnk-no-ts-b',
            ianaLanguage: 'fr',
            createdAt: undefined,
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.responses[0].linkId).toBe('lnk-no-ts-a');
      expect(document.responses[0].hreflang).toEqual(['en', 'fr']);
    });

    it('keeps variants in distinct 4-tuple groups separate', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-us',
            context: 'us',
            ianaLanguage: 'en',
          }),
          baseLegacyResponse({
            linkId: 'lnk-au',
            context: 'au',
            ianaLanguage: 'en',
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.responses).toHaveLength(2);
      const ids = document.responses.map((r) => r.linkId).sort();
      expect(ids).toEqual(['lnk-au', 'lnk-us']);
    });
  });

  describe('default flag re-enforcement', () => {
    it('removes defaultIanaLanguage and re-runs default-flag enforcement', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-1',
            ianaLanguage: 'en',
            defaultIanaLanguage: true,
            defaultContext: true,
          }),
          baseLegacyResponse({
            linkId: 'lnk-2',
            context: 'au',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            defaultIanaLanguage: true,
            defaultContext: true,
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      for (const response of document.responses) {
        expect(response).not.toHaveProperty('defaultIanaLanguage');
      }
      // defaultContext is per linkType; only one variant retains it.
      const defaults = document.responses.filter((r) => r.defaultContext);
      expect(defaults).toHaveLength(1);
    });
  });

  describe('version history rewrite', () => {
    it('rewrites previousIanaLanguage into previousHreflang as a single-element array', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [baseLegacyResponse({ ianaLanguage: 'fr' })],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'lnk-1',
                action: 'updated',
                previousTargetUrl: 'https://example.com/old-cert',
                previousIanaLanguage: 'en',
              },
            ],
          },
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.rewrittenVersionEntries).toBe(1);
      const change: any = document.versionHistory![0].changes[0];
      expect(change).not.toHaveProperty('previousIanaLanguage');
      expect(change.previousHreflang).toEqual(['en']);
      expect(change.previousTargetUrl).toBe('https://example.com/old-cert');
    });

    it('drops previousIanaLanguage entirely when the legacy value was empty', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [baseLegacyResponse()],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'lnk-1',
                action: 'updated',
                previousIanaLanguage: '   ',
              },
            ],
          },
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      const change: any = document.versionHistory![0].changes[0];
      expect(change).not.toHaveProperty('previousIanaLanguage');
      expect(change).not.toHaveProperty('previousHreflang');
    });

    it('passes through version history changes that have no legacy field', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [baseLegacyResponse()],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [{ linkId: 'lnk-1', action: 'created' }],
          },
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.rewrittenVersionEntries).toBe(0);
      expect(document.versionHistory![0].changes[0]).toEqual({
        linkId: 'lnk-1',
        action: 'created',
      });
    });
  });

  describe('linkset rebuild', () => {
    it('rebuilds the linkset from merged responses', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            ianaLanguage: 'en',
            hreflang: ['en-US'],
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.linkset).toBeDefined();
      expect(document.linkset!.anchor).toContain(
        'http://localhost:3000/api/4.0.0/gs1/01/09359502000041',
      );
      const certRel = Object.keys(document.linkset!).find((k) =>
        k.endsWith('/certificationInfo'),
      );
      expect(certRel).toBeDefined();
      const targets = (document.linkset as any)[certRel!];
      expect(targets[0].hreflang).toEqual(['en-US', 'en']);
    });
  });

  describe('predecessor-version history preservation', () => {
    it('emits predecessor-version link target entries when versionHistory carries previousTargetUrl', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-1',
            ianaLanguage: 'en',
          }),
        ],
        versionHistory: [
          {
            version: 2,
            updatedAt: '2026-02-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'lnk-1',
                action: 'updated',
                previousTargetUrl: 'https://example.com/old-cert',
                previousIanaLanguage: 'fr',
              },
            ],
          },
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [{ linkId: 'lnk-1', action: 'created' }],
          },
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      expect(document.versionHistory).toHaveLength(2);
      expect(document.linkset).toBeDefined();
      const certRel = Object.keys(document.linkset!).find((k) =>
        k.endsWith('/certificationInfo'),
      );
      const targets: any[] = (document.linkset as any)[certRel!];
      const predecessor = targets.find(
        (t) => Array.isArray(t.rel) && t.rel.includes('predecessor-version'),
      );
      expect(predecessor).toBeDefined();
      expect(predecessor.href).toBe('https://example.com/old-cert');
    });
  });

  describe('4-tuple case sensitivity', () => {
    it('treats variants differing only in case as distinct (RFC 3986)', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-lower',
            targetUrl: 'https://example.com/Cert',
            ianaLanguage: 'en',
          }),
          baseLegacyResponse({
            linkId: 'lnk-mixed',
            targetUrl: 'https://example.com/cert',
            ianaLanguage: 'en',
          }),
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.inputResponseCount).toBe(2);
      expect(outcome.outputResponseCount).toBe(2);
      expect(outcome.discardedLinkIds).toEqual([]);
      const ids = document.responses.map((r) => r.linkId).sort();
      expect(ids).toEqual(['lnk-lower', 'lnk-mixed']);
    });
  });

  describe('mixed legacy and non-legacy version-history changes', () => {
    it('rewrites only the change that carries previousIanaLanguage and leaves siblings alone', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [baseLegacyResponse({ ianaLanguage: 'fr' })],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [
              { linkId: 'lnk-2', action: 'created' },
              {
                linkId: 'lnk-1',
                action: 'updated',
                previousIanaLanguage: 'en',
                previousTargetUrl: 'https://example.com/old-cert',
              },
              {
                linkId: 'lnk-3',
                action: 'deleted',
                previousTargetUrl: 'https://example.com/gone',
              },
            ],
          },
        ],
      };

      const { document, outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.rewrittenVersionEntries).toBe(1);
      const entry = document.versionHistory![0];
      expect(entry.changes).toHaveLength(3);
      expect(entry.changes[0]).toEqual({ linkId: 'lnk-2', action: 'created' });
      const updated: any = entry.changes[1];
      expect(updated.previousHreflang).toEqual(['en']);
      expect(updated).not.toHaveProperty('previousIanaLanguage');
      expect(updated.previousTargetUrl).toBe('https://example.com/old-cert');
      const deleted: any = entry.changes[2];
      expect(deleted).toEqual({
        linkId: 'lnk-3',
        action: 'deleted',
        previousTargetUrl: 'https://example.com/gone',
      });
    });
  });

  describe('response field pass-through', () => {
    it('keeps unrelated fields (accessRole, public, etc.) intact across migration', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            ianaLanguage: 'en',
            accessRole: ['supplier', 'auditor'],
            public: false,
            rel: 'gs1:certificationInfo',
            decryptionKey: 'k-xyz',
          }),
        ],
      };

      const { document } = migrateUriDocument(doc, attrs);

      const r: any = document.responses[0];
      expect(r.accessRole).toEqual(['supplier', 'auditor']);
      expect(r.public).toBe(false);
      expect(r.rel).toBe('gs1:certificationInfo');
      expect(r.decryptionKey).toBe('k-xyz');
    });
  });

  describe('discarded link-id tracking', () => {
    it('records discarded variant linkIds for caller orphan-index cleanup', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          baseLegacyResponse({
            linkId: 'lnk-keep',
            ianaLanguage: 'en',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
          baseLegacyResponse({
            linkId: 'lnk-drop-a',
            ianaLanguage: 'fr',
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
          baseLegacyResponse({
            linkId: 'lnk-drop-b',
            ianaLanguage: 'de',
            createdAt: '2026-01-03T00:00:00.000Z',
          }),
        ],
      };

      const { outcome, document } = migrateUriDocument(doc, attrs);

      expect(outcome.outputResponseCount).toBe(1);
      expect(document.responses[0].linkId).toBe('lnk-keep');
      expect(outcome.discardedLinkIds.sort()).toEqual([
        'lnk-drop-a',
        'lnk-drop-b',
      ]);
    });
  });

  describe('detection of legacy fields', () => {
    it('treats a doc with only legacy version-history fields as in need of migration', () => {
      const doc: any = {
        ...baseLegacyDoc(),
        responses: [
          {
            targetUrl: 'https://example.com/cert',
            title: 'Cert',
            linkType: 'gs1:certificationInfo',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
            hreflang: ['en'],
          },
        ],
        versionHistory: [
          {
            version: 1,
            updatedAt: '2026-01-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'lnk-1',
                action: 'updated',
                previousIanaLanguage: 'fr',
              },
            ],
          },
        ],
      };

      const { outcome } = migrateUriDocument(doc, attrs);

      expect(outcome.mutated).toBe(true);
      expect(outcome.rewrittenVersionEntries).toBe(1);
    });
  });
});
