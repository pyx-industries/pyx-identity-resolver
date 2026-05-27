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

    const buildParams = (
      attrs: Record<string, unknown>,
    ): LinkResolutionDto => ({
      namespace: 'idr',
      identifiers: { primary: { id: '9359502000041', qualifier: 'gtin' } },
      descriptiveAttributes: attrs,
    });

    beforeEach(() => {
      uri = {
        id: 'idr/01/09359502000041',
        namespace: 'idr',
        identificationKeyType: 'gtin',
        identificationKey: '9359502000041',
        description: 'DPP',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'http://example-json.com.au',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            hreflang: ['en-AU'],
            context: 'au',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultContext: false,
            defaultMimeType: false,
          },
          {
            targetUrl: 'http://example-html.com.au',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            hreflang: ['en-AU'],
            context: 'au',
            mimeType: 'text/html',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultContext: false,
            defaultMimeType: true,
          },
          {
            targetUrl: 'http://example-json.com',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            hreflang: ['en-US'],
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultContext: false,
            defaultMimeType: false,
          },
          {
            targetUrl: 'http://example-html.com',
            title: 'Passport',
            linkType: 'idr:certificationInfo',
            hreflang: ['en-US'],
            context: 'us',
            mimeType: 'text/html',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
        linkset: {
          anchor: 'http://localhost:3000/01/09359502000041',
          description: 'Passport',
          'https://idr.com/voc/certificationInfo': [
            {
              href: 'http://example-json.com',
              title: 'Passport',
              type: 'application/json',
              hreflang: ['en-US'],
            },
          ],
        },
      };
    });

    describe('linkType=all', () => {
      it('returns the stored linkset', () => {
        const result = processUri(
          uri,
          buildParams({ linkType: 'all' }),
          defaultContext,
        );

        expect(result.data).toEqual({ linkset: [uri.linkset] });
        expect(result.mimeType).toBe('application/json');
        expect(result.linkHeaderText).toBeDefined();
        expect(result.linkHeaderTextFull).toBeDefined();
      });

      it('returns undefined when linkset is missing', () => {
        uri.linkset = undefined;
        const result = processUri(
          uri,
          buildParams({ linkType: 'all' }),
          defaultContext,
        );
        expect(result).toBeUndefined();
      });
    });

    describe('cascade for a specific linkType', () => {
      it('tier 1: returns the exact match on hreflang + mimeType', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-AU'],
            mimeTypes: ['application/json'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // V0 is the only en-AU + json variant; defaultContext irrelevant at this tier
        expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
        expect(result.mimeType).toBe('application/json');
      });

      it('tier 1: prefers the hreflang + mime match over the defaultContext variant', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-AU'],
            mimeTypes: ['text/html'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // V1 (en-AU html) is the direct match; V3 (defaultContext, en-US html) is ignored
        expect(result.targetUrl).toBe(uri.responses[1].targetUrl);
        expect(result.mimeType).toBe('text/html');
      });

      it('tier 2: picks the hreflang-matching variant carrying defaultMimeType=true', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-AU'],
            mimeTypes: ['application/pdf'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No en-AU + pdf. V1 (en-AU + defaultMimeType=true for cert+au)
        // wins at tier 2.
        expect(result.targetUrl).toBe(uri.responses[1].targetUrl);
      });

      it('tier 3: returns first hreflang match when no mime match and no defaultMimeType variant for the language', () => {
        uri.responses[1].defaultMimeType = false;
        uri.responses[3].defaultMimeType = false;
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-AU'],
            mimeTypes: ['application/pdf'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No en-AU + pdf, no en-AU + defaultMime; reverse iter picks V1 before V0
        expect(result.targetUrl).toBe(uri.responses[1].targetUrl);
      });

      it('tier 3: returns hreflang match when no mime preference is supplied', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-US'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No mime requested means tier 1 fails (empty mime list), tier 2 hits
        // V3 (en-US + defaultMimeType) directly
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('tier 4: falls back to defaultContext when no variant matches the requested hreflang', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['fr'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No fr hreflang match anywhere; cascade returns defaultContext (V3)
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('tier 4: applies when no hreflang preference is supplied at all', () => {
        const result = processUri(
          uri,
          buildParams({ linkType: 'idr:certificationInfo' }),
          defaultContext,
        ) as ResolvedLink;

        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('tier 5: returns first linkType match when no hreflang and no defaultContext match', () => {
        uri.responses = uri.responses.map((r) => ({
          ...r,
          defaultContext: false,
        }));
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['fr'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // Reverse iteration picks the last-registered linkType match
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('tier 6: returns defaultLinkType variant when linkType is omitted', () => {
        const result = processUri(
          uri,
          buildParams({}),
          defaultContext,
        ) as ResolvedLink;

        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });
    });

    describe('hreflang matching', () => {
      it('treats variants with an empty hreflang[] as non-matching', () => {
        uri.responses.forEach((r) => (r.hreflang = []));
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-US'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No hreflang matches; cascade falls to defaultContext (V3)
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('treats variants with undefined hreflang as non-matching', () => {
        uri.responses.forEach((r) => delete (r as any).hreflang);
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-US'],
          }),
          defaultContext,
        ) as ResolvedLink;

        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('matches when any client preference appears in any variant hreflang entry', () => {
        uri.responses[0].hreflang = ['en-AU', 'en-NZ'];
        uri.responses[0].defaultContext = true;
        uri.responses[3].defaultContext = false;
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['fr', 'en-NZ'],
            mimeTypes: ['application/json'],
          }),
          defaultContext,
        ) as ResolvedLink;

        expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
      });

      it('matches case-insensitively on both sides per RFC 4647', () => {
        // Isolate V0 as the only en-AU candidate
        uri.responses[0].hreflang = ['EN-au'];
        uri.responses[1].hreflang = ['fr-FR'];
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-AU'],
            mimeTypes: ['application/json'],
          }),
          defaultContext,
        ) as ResolvedLink;

        expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
      });

      it('treats the negotiator wildcard "*" as a non-match (no Accept-Language case)', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['*'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // '*' matches no variant's hreflang; cascade falls to defaultContext (V3)
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('treats the negotiator wildcard "*/*" mime as a non-match for tier 1 (no Accept case)', () => {
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-US'],
            mimeTypes: ['*/*'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // '*/*' does not exact-match any variant.mimeType at tier 1;
        // tier 2 (defaultMimeType) wins via V3
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
      });

      it('does not fall back across BCP 47 subtags (en-GB does not match en)', () => {
        uri.responses[0].hreflang = ['en'];
        uri.responses[0].defaultContext = true;
        uri.responses[3].defaultContext = false;
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-GB'],
          }),
          defaultContext,
        ) as ResolvedLink;

        // No exact en-GB match; cascade falls through to defaultContext (V0)
        expect(result.targetUrl).toBe(uri.responses[0].targetUrl);
      });
    });

    it('returns undefined when linkType is supplied but never registered', () => {
      const result = processUri(
        uri,
        buildParams({ linkType: 'invalid' }),
        defaultContext,
      );
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

      it('rebuilds linkset from responses when linkType is all', () => {
        const accessRoleContext: ResolutionContext = {
          ...reconstructionContext,
          accessRole: 'customer',
        };
        const result = processUri(
          uri,
          buildParams({ linkType: 'all' }),
          accessRoleContext,
        );

        expect(result).toBeDefined();
        expect(result.mimeType).toBe('application/json');
        expect(result.data.linkset[0].anchor).toBe(expectedRebuiltAnchor);
        expect(result.data.linkset[0].anchor).not.toBe(uri.linkset.anchor);
      });

      it('returns a resolved link with a rebuilt linkset for a specific linkType', () => {
        const accessRoleContext: ResolutionContext = {
          ...reconstructionContext,
          accessRole: 'customer',
        };
        const result = processUri(
          uri,
          buildParams({
            linkType: 'idr:certificationInfo',
            hreflangPreferences: ['en-US'],
            mimeTypes: ['text/html'],
          }),
          accessRoleContext,
        ) as ResolvedLink;

        expect(result).toBeDefined();
        expect(result.targetUrl).toBe(uri.responses[3].targetUrl);
        expect(result.data.linkset[0].anchor).toBe(expectedRebuiltAnchor);
        expect(result.data.linkset[0].anchor).not.toBe(uri.linkset.anchor);
      });

      it('returns undefined when linkType=all and responses are empty', () => {
        uri.responses = [];
        const result = processUri(
          uri,
          buildParams({ linkType: 'all' }),
          reconstructionContext,
        );
        expect(result).toBeUndefined();
      });

      it('returns undefined when linkType=all and all responses are inactive', () => {
        uri.responses = uri.responses.map((r) => ({ ...r, active: false }));
        const result = processUri(
          uri,
          buildParams({ linkType: 'all' }),
          reconstructionContext,
        );
        expect(result).toBeUndefined();
      });
    });
  });
});
