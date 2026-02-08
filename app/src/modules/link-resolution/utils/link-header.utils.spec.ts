import { Logger } from '@nestjs/common';
import { ResolutionContext } from '../interfaces/link-resolution.interface';
import { LinkResponse } from '../interfaces/uri.interface';
import {
  buildCanonicalUrl,
  buildParentLinksetRefs,
  constructLinkHeader,
} from './link-header.utils';

/**
 * Helper to build a minimal {@link LinkResponse} with only the fields
 * relevant to link header construction.
 */
const buildResponse = (
  overrides: Partial<LinkResponse> = {},
): LinkResponse => ({
  targetUrl: 'https://example.com/target',
  title: 'Example',
  linkType: 'gs1:pip',
  ianaLanguage: 'en',
  context: 'au',
  mimeType: 'application/json',
  active: true,
  fwqs: false,
  defaultLinkType: false,
  defaultIanaLanguage: false,
  defaultContext: false,
  defaultMimeType: false,
  ...overrides,
});

const baseCtx: ResolutionContext = {
  identificationKeyCode: '01',
  resolverDomain: 'https://resolver.example.com/api/1.0.0',
  linkTypeVocDomain: 'https://resolver.example.com/api/1.0.0/voc',
  namespace: 'gs1',
  identificationKey: '09359502000041',
  qualifierPath: '/',
  linkHeaderMaxSize: 8192,
};

describe('LinkHeaderUtils', () => {
  describe('buildCanonicalUrl', () => {
    it('should build canonical URL without qualifier path for root', () => {
      const url = buildCanonicalUrl(baseCtx);
      expect(url).toBe(
        'https://resolver.example.com/api/1.0.0/gs1/01/09359502000041',
      );
    });

    it('should include qualifier path when not root', () => {
      const url = buildCanonicalUrl({
        ...baseCtx,
        qualifierPath: '/10/LOT1234',
      });
      expect(url).toBe(
        'https://resolver.example.com/api/1.0.0/gs1/01/09359502000041/10/LOT1234',
      );
    });

    it('should handle multi-level qualifier paths', () => {
      const url = buildCanonicalUrl({
        ...baseCtx,
        qualifierPath: '/10/LOT1234/21/SER5678',
      });
      expect(url).toBe(
        'https://resolver.example.com/api/1.0.0/gs1/01/09359502000041/10/LOT1234/21/SER5678',
      );
    });
  });

  describe('buildParentLinksetRefs', () => {
    it('should return empty array for root-level identifiers (qualifierPath="/")', () => {
      const refs = buildParentLinksetRefs(baseCtx);
      expect(refs).toEqual([]);
    });

    it('should return 1 ancestor for a single qualifier pair', () => {
      const ctx = { ...baseCtx, qualifierPath: '/10/LOT1234' };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toBe(
        '<https://resolver.example.com/api/1.0.0/gs1/01/09359502000041?linkType=all>; rel="linkset"; type="application/linkset+json"',
      );
    });

    it('should return 2 ancestors for two qualifier pairs, nearest first', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/LOT1234/21/SER5678',
      };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs).toHaveLength(2);
      // Nearest ancestor: /10/LOT1234
      expect(refs[0]).toContain('/10/LOT1234?linkType=all');
      expect(refs[0]).not.toContain('/21/SER5678');
      // Next ancestor: root (no qualifier path)
      expect(refs[1]).toBe(
        '<https://resolver.example.com/api/1.0.0/gs1/01/09359502000041?linkType=all>; rel="linkset"; type="application/linkset+json"',
      );
    });

    it('should return 3 ancestors for three qualifier pairs', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/v1/21/v2/22/v3',
      };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs).toHaveLength(3);
      // Nearest: /10/v1/21/v2
      expect(refs[0]).toContain('/10/v1/21/v2?linkType=all');
      // Middle: /10/v1
      expect(refs[1]).toContain('/10/v1?linkType=all');
      // Furthest: root
      expect(refs[2]).toContain('/gs1/01/09359502000041?linkType=all');
    });

    it('should cap at 3 ancestors even for 4+ qualifier pairs', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/q1/v1/q2/v2/q3/v3/q4/v4',
      };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs).toHaveLength(3);
      // Only the 3 nearest ancestors
      expect(refs[0]).toContain('/q1/v1/q2/v2/q3/v3?linkType=all');
      expect(refs[1]).toContain('/q1/v1/q2/v2?linkType=all');
      expect(refs[2]).toContain('/q1/v1?linkType=all');
    });

    it('should include accessRole in linkset URLs when present', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/LOT1234',
        accessRole: 'customer',
      };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs).toHaveLength(1);
      expect(refs[0]).toContain('&accessRole=customer');
    });

    it('should omit accessRole from linkset URLs when absent', () => {
      const ctx = { ...baseCtx, qualifierPath: '/10/LOT1234' };
      const refs = buildParentLinksetRefs(ctx);
      expect(refs[0]).not.toContain('accessRole');
    });
  });

  describe('constructLinkHeader', () => {
    it('should filter linkHeaderText by resolvedLinkType while linkHeaderTextFull includes all', () => {
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/cert1',
          linkType: 'gs1:certificationInfo',
          title: 'Cert 1',
        }),
        buildResponse({
          targetUrl: 'https://example.com/cert2',
          linkType: 'gs1:certificationInfo',
          title: 'Cert 2',
        }),
        buildResponse({
          targetUrl: 'https://example.com/pip',
          linkType: 'gs1:pip',
          title: 'PIP',
        }),
      ];

      const result = constructLinkHeader(
        responses,
        baseCtx,
        'gs1:certificationInfo',
      );

      // linkHeaderText should contain only the 2 certificationInfo targets
      expect(result.linkHeaderText).toContain('https://example.com/cert1');
      expect(result.linkHeaderText).toContain('https://example.com/cert2');
      expect(result.linkHeaderText).not.toContain('https://example.com/pip');

      // linkHeaderTextFull should contain all 3 targets
      expect(result.linkHeaderTextFull).toContain('https://example.com/cert1');
      expect(result.linkHeaderTextFull).toContain('https://example.com/cert2');
      expect(result.linkHeaderTextFull).toContain('https://example.com/pip');
    });

    it('should include all active targets in both variants when resolvedLinkType is undefined (linkType=all)', () => {
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/cert',
          linkType: 'gs1:certificationInfo',
          title: 'Cert',
        }),
        buildResponse({
          targetUrl: 'https://example.com/pip',
          linkType: 'gs1:pip',
          title: 'PIP',
        }),
      ];

      const result = constructLinkHeader(responses, baseCtx, undefined);

      expect(result.linkHeaderText).toContain('https://example.com/cert');
      expect(result.linkHeaderText).toContain('https://example.com/pip');
      expect(result.linkHeaderTextFull).toContain('https://example.com/cert');
      expect(result.linkHeaderTextFull).toContain('https://example.com/pip');
    });

    it('should drop all target links when size exceeds linkHeaderMaxSize (truncation fallback)', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/very-long-target-url',
          linkType: 'gs1:pip',
          title: 'A long title for testing',
        }),
      ];

      // Mandatory entries are ~205 bytes; set limit above mandatory but below mandatory+targets
      const ctx = { ...baseCtx, linkHeaderMaxSize: 250 };
      const result = constructLinkHeader(responses, ctx);

      // Target links should be dropped from linkHeaderText
      expect(result.linkHeaderText).not.toContain(
        'https://example.com/very-long-target-url',
      );
      // owl:sameAs and linkset ref should remain
      expect(result.linkHeaderText).toContain('rel="owl:sameAs"');
      expect(result.linkHeaderText).toContain('rel="linkset"');

      // linkHeaderTextFull should still contain everything
      expect(result.linkHeaderTextFull).toContain(
        'https://example.com/very-long-target-url',
      );

      // Warning should have been logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('target links removed'),
      );

      warnSpy.mockRestore();
    });

    it('should return 1 parent ref for a single qualifier pair', () => {
      const ctx = { ...baseCtx, qualifierPath: '/10/LOT1234' };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Count linkset refs: self + 1 parent = 2 linkset entries
      const linksetMatches = result.linkHeaderText.match(/rel="linkset"/g);
      expect(linksetMatches).toHaveLength(2);
    });

    it('should return 2 parent refs for two qualifier pairs', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/LOT1234/21/SER5678',
      };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Count linkset refs: self + 2 parents = 3 linkset entries
      const linksetMatches = result.linkHeaderText.match(/rel="linkset"/g);
      expect(linksetMatches).toHaveLength(3);
    });

    it('should return 3 parent refs for three qualifier pairs', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/v1/21/v2/22/v3',
      };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Count linkset refs: self + 3 parents = 4 linkset entries
      const linksetMatches = result.linkHeaderText.match(/rel="linkset"/g);
      expect(linksetMatches).toHaveLength(4);
    });

    it('should include only 3 nearest parent refs for 4+ qualifier pairs', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/q1/v1/q2/v2/q3/v3/q4/v4',
      };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Count linkset refs: self + 3 parents (capped) = 4 linkset entries
      const linksetMatches = result.linkHeaderText.match(/rel="linkset"/g);
      expect(linksetMatches).toHaveLength(4);
    });

    it('should have no parent refs when qualifierPath is "/" (root)', () => {
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, baseCtx);

      // Count linkset refs: self only = 1 linkset entry
      const linksetMatches = result.linkHeaderText.match(/rel="linkset"/g);
      expect(linksetMatches).toHaveLength(1);
    });

    it('should include accessRole in self and parent linkset URLs when present', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/LOT1234',
        accessRole: 'customer',
      };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Self linkset ref should include accessRole
      expect(result.linkHeaderText).toContain(
        '?linkType=all&accessRole=customer>; rel="linkset"',
      );
      // Parent linkset ref should include accessRole
      const parentRefPattern =
        /09359502000041\?linkType=all&accessRole=customer>/;
      expect(result.linkHeaderText).toMatch(parentRefPattern);
    });

    it('should omit accessRole from linkset URLs when not present', () => {
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, baseCtx);

      expect(result.linkHeaderText).not.toContain('accessRole');
    });

    it('should produce owl:sameAs entry with correct canonical URL', () => {
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, baseCtx);

      expect(result.linkHeaderText).toContain(
        '<https://resolver.example.com/api/1.0.0/gs1/01/09359502000041>; rel="owl:sameAs"',
      );
    });

    it('should maintain correct entry ordering: owl:sameAs, self linkset, parents, targets', () => {
      const ctx = {
        ...baseCtx,
        qualifierPath: '/10/LOT1234',
      };
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/target1',
          linkType: 'gs1:pip',
          title: 'Target',
        }),
      ];

      const result = constructLinkHeader(responses, ctx);
      const parts = result.linkHeaderText.split(', ');

      // First entry: owl:sameAs
      expect(parts[0]).toContain('rel="owl:sameAs"');
      // Second entry: self linkset
      expect(parts[1]).toContain('rel="linkset"');
      expect(parts[1]).toContain('/10/LOT1234?linkType=all');
      // Third entry: parent linkset ref
      expect(parts[2]).toContain('rel="linkset"');
      expect(parts[2]).not.toContain('/10/LOT1234');
      // Fourth entry: target link
      expect(parts[3]).toContain('https://example.com/target1');
      expect(parts[3]).toContain('rel="gs1:pip"');
    });

    it('should measure multi-byte characters correctly for truncation', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const multiByteTitle = '\u{1F4E6}\u{1F30D}\u{1F50D}'; // 3 emojis, 4 bytes each = 12 bytes for title alone
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/target',
          linkType: 'gs1:pip',
          title: multiByteTitle,
        }),
      ];

      // Set a size just large enough for mandatory entries but not targets
      const mandatoryOnly = constructLinkHeader([], baseCtx);
      const mandatorySize = Buffer.byteLength(
        mandatoryOnly.linkHeaderText,
        'utf-8',
      );

      // Set max to just above mandatory so targets push it over
      const ctx = { ...baseCtx, linkHeaderMaxSize: mandatorySize + 10 };
      const result = constructLinkHeader(responses, ctx);

      // Targets should be dropped because multi-byte characters make them exceed the budget
      expect(result.linkHeaderText).not.toContain(multiByteTitle);
      expect(result.linkHeaderText).toContain('rel="owl:sameAs"');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should emit header and log warning when mandatory entries alone exceed linkHeaderMaxSize', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const ctx = { ...baseCtx, linkHeaderMaxSize: 10 };
      const responses = [buildResponse()];

      const result = constructLinkHeader(responses, ctx);

      // Header should still be emitted with mandatory entries
      expect(result.linkHeaderText).toContain('rel="owl:sameAs"');
      expect(result.linkHeaderText).toContain('rel="linkset"');

      // Warning about mandatory entries exceeding limit
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('mandatory entries'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceed configured limit'),
      );

      warnSpy.mockRestore();
    });

    it('should exclude inactive responses from both linkHeaderText and linkHeaderTextFull', () => {
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/active',
          linkType: 'gs1:pip',
          title: 'Active',
          active: true,
        }),
        buildResponse({
          targetUrl: 'https://example.com/inactive',
          linkType: 'gs1:pip',
          title: 'Inactive',
          active: false,
        }),
      ];

      const result = constructLinkHeader(responses, baseCtx);

      expect(result.linkHeaderText).toContain('https://example.com/active');
      expect(result.linkHeaderText).not.toContain(
        'https://example.com/inactive',
      );
      expect(result.linkHeaderTextFull).toContain('https://example.com/active');
      expect(result.linkHeaderTextFull).not.toContain(
        'https://example.com/inactive',
      );
    });

    it('should include all active targets in linkHeaderTextFull regardless of resolvedLinkType', () => {
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/cert',
          linkType: 'gs1:certificationInfo',
          title: 'Cert',
        }),
        buildResponse({
          targetUrl: 'https://example.com/pip',
          linkType: 'gs1:pip',
          title: 'PIP',
        }),
        buildResponse({
          targetUrl: 'https://example.com/inactive',
          linkType: 'gs1:pip',
          title: 'Inactive PIP',
          active: false,
        }),
      ];

      const result = constructLinkHeader(
        responses,
        baseCtx,
        'gs1:certificationInfo',
      );

      // linkHeaderText should only have certificationInfo
      expect(result.linkHeaderText).toContain('https://example.com/cert');
      expect(result.linkHeaderText).not.toContain('https://example.com/pip');

      // linkHeaderTextFull should have all ACTIVE targets
      expect(result.linkHeaderTextFull).toContain('https://example.com/cert');
      expect(result.linkHeaderTextFull).toContain('https://example.com/pip');
      expect(result.linkHeaderTextFull).not.toContain(
        'https://example.com/inactive',
      );
    });

    it('should format target link entries correctly', () => {
      const responses = [
        buildResponse({
          targetUrl: 'https://example.com/passport',
          linkType: 'gs1:certificationInfo',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          title: 'Digital Passport',
        }),
      ];

      const result = constructLinkHeader(responses, baseCtx);

      expect(result.linkHeaderText).toContain(
        '<https://example.com/passport>; rel="gs1:certificationInfo"; type="application/json"; hreflang="en"; title="Digital Passport"',
      );
    });

    it('should return only mandatory entries when no responses are provided', () => {
      const result = constructLinkHeader([], baseCtx);

      expect(result.linkHeaderText).toContain('rel="owl:sameAs"');
      expect(result.linkHeaderText).toContain('rel="linkset"');
      // No target links
      const parts = result.linkHeaderText.split(', ');
      expect(parts).toHaveLength(2); // owl:sameAs + self linkset
    });
  });
});
