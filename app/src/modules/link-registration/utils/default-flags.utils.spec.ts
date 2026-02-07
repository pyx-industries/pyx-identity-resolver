import { LinkResponse } from '../../link-resolution/interfaces/uri.interface';
import { recalculateDefaultFlags } from './default-flags.utils';

describe('recalculateDefaultFlags', () => {
  const createResponse = (
    overrides: Partial<LinkResponse> = {},
  ): LinkResponse => ({
    targetUrl: 'https://example.com',
    title: 'Test',
    linkType: 'gs1:pip',
    ianaLanguage: 'en',
    context: 'us',
    mimeType: 'text/html',
    active: true,
    fwqs: false,
    defaultLinkType: false,
    defaultIanaLanguage: false,
    defaultContext: false,
    defaultMimeType: false,
    ...overrides,
  });

  describe('edge cases', () => {
    it('should handle empty responses array', () => {
      const responses: LinkResponse[] = [];
      const result = recalculateDefaultFlags(responses);
      expect(result).toEqual([]);
    });

    it('should handle null/undefined responses', () => {
      expect(recalculateDefaultFlags(null as any)).toBeNull();
      expect(recalculateDefaultFlags(undefined as any)).toBeUndefined();
    });

    it('should handle single active response by promoting it as default', () => {
      const responses = [createResponse()];
      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(true);
      expect(responses[0].defaultIanaLanguage).toBe(true);
      expect(responses[0].defaultContext).toBe(true);
      expect(responses[0].defaultMimeType).toBe(true);
    });

    it('should not promote an inactive-only array', () => {
      const responses = [
        createResponse({ active: false }),
        createResponse({ active: false }),
      ];
      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[1].defaultLinkType).toBe(false);
    });
  });

  describe('inactive responses', () => {
    it('should clear default flags on inactive responses', () => {
      const responses = [
        createResponse({
          active: false,
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({ active: true }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[0].defaultContext).toBe(false);
      expect(responses[0].defaultMimeType).toBe(false);
    });

    it('should promote active response when previous default becomes inactive', () => {
      const responses = [
        createResponse({
          linkId: 'link1',
          active: false,
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({
          linkId: 'link2',
          active: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      // Inactive link loses all defaults
      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[0].defaultContext).toBe(false);
      expect(responses[0].defaultMimeType).toBe(false);

      // Active link gets promoted
      expect(responses[1].defaultLinkType).toBe(true);
      expect(responses[1].defaultIanaLanguage).toBe(true);
      expect(responses[1].defaultContext).toBe(true);
      expect(responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('defaultLinkType - global scope', () => {
    it('should ensure only one active response has defaultLinkType true', () => {
      const responses = [
        createResponse({ linkId: 'link1', defaultLinkType: true }),
        createResponse({
          linkId: 'link2',
          linkType: 'gs1:epcis',
          defaultLinkType: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[1].defaultLinkType).toBe(true);
    });

    it('should promote first active response when no default exists', () => {
      const responses = [
        createResponse({ linkId: 'link1' }),
        createResponse({ linkId: 'link2', linkType: 'gs1:epcis' }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(true);
      expect(responses[1].defaultLinkType).toBe(false);
    });

    it('should skip inactive responses when promoting', () => {
      const responses = [
        createResponse({ linkId: 'link1', active: false }),
        createResponse({ linkId: 'link2', linkType: 'gs1:epcis' }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[1].defaultLinkType).toBe(true);
    });
  });

  describe('defaultIanaLanguage - per linkType scope', () => {
    it('should keep only the last default for the same linkType', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'fr',
          defaultIanaLanguage: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[1].defaultIanaLanguage).toBe(true);
    });

    it('should allow different linkTypes to each have their own default', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:epcis',
          defaultIanaLanguage: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultIanaLanguage).toBe(true);
      expect(responses[1].defaultIanaLanguage).toBe(true);
    });

    it('should promote first active in scope when default is removed', () => {
      const responses = [
        createResponse({
          linkId: 'link1',
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          active: false,
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkId: 'link2',
          linkType: 'gs1:pip',
          ianaLanguage: 'fr',
        }),
        createResponse({
          linkId: 'link3',
          linkType: 'gs1:pip',
          ianaLanguage: 'de',
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[1].defaultIanaLanguage).toBe(true);
      expect(responses[2].defaultIanaLanguage).toBe(false);
    });
  });

  describe('defaultContext - per linkType + ianaLanguage scope', () => {
    it('should keep only the last default for same linkType and language', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'us',
          defaultContext: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultContext).toBe(false);
      expect(responses[1].defaultContext).toBe(true);
    });

    it('should allow different linkType+language combinations to each have defaults', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'fr',
          context: 'au',
          defaultContext: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultContext).toBe(true);
      expect(responses[1].defaultContext).toBe(true);
    });
  });

  describe('defaultMimeType - per linkType + ianaLanguage + context scope', () => {
    it('should keep only the last default for same full scope', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'text/html',
          defaultMimeType: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultMimeType).toBe(false);
      expect(responses[1].defaultMimeType).toBe(true);
    });

    it('should allow different full scopes to each have their own default', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'us',
          defaultMimeType: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultMimeType).toBe(true);
      expect(responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('should treat linkType case-insensitively for defaultIanaLanguage scope', () => {
      const responses = [
        createResponse({
          linkType: 'GS1:PIP',
          ianaLanguage: 'en',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'fr',
          defaultIanaLanguage: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[1].defaultIanaLanguage).toBe(true);
    });

    it('should treat ianaLanguage case-insensitively for defaultContext scope', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'EN',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'us',
          defaultContext: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultContext).toBe(false);
      expect(responses[1].defaultContext).toBe(true);
    });

    it('should treat context case-insensitively for defaultMimeType scope', () => {
      const responses = [
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'AU',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'text/html',
          defaultMimeType: true,
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultMimeType).toBe(false);
      expect(responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('promotion after deletion', () => {
    it('should promote defaults when the only default link is removed from array', () => {
      // Simulates a hard delete: the default link has been spliced out
      const responses = [
        createResponse({
          linkId: 'link2',
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'us',
        }),
        createResponse({
          linkId: 'link3',
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'au',
        }),
      ];

      recalculateDefaultFlags(responses);

      // First active response should be promoted for global scope
      expect(responses[0].defaultLinkType).toBe(true);
      expect(responses[1].defaultLinkType).toBe(false);

      // First active in linkType scope promoted for defaultIanaLanguage
      expect(responses[0].defaultIanaLanguage).toBe(true);
      expect(responses[1].defaultIanaLanguage).toBe(false);

      // Both in same linkType+lang scope, first promoted for defaultContext
      expect(responses[0].defaultContext).toBe(true);
      expect(responses[1].defaultContext).toBe(false);

      // Different context scopes, so each gets promoted for defaultMimeType
      expect(responses[0].defaultMimeType).toBe(true);
      expect(responses[1].defaultMimeType).toBe(true);
    });

    it('should promote defaults when the default link is soft-deleted (set inactive)', () => {
      const responses = [
        createResponse({
          linkId: 'link1',
          active: false,
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({
          linkId: 'link2',
          linkType: 'gs1:pip',
          ianaLanguage: 'en',
          context: 'us',
        }),
      ];

      recalculateDefaultFlags(responses);

      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[0].defaultIanaLanguage).toBe(false);
      expect(responses[0].defaultContext).toBe(false);
      expect(responses[0].defaultMimeType).toBe(false);

      expect(responses[1].defaultLinkType).toBe(true);
      expect(responses[1].defaultIanaLanguage).toBe(true);
      expect(responses[1].defaultContext).toBe(true);
      expect(responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('update scenarios', () => {
    it('should unset old default when a new default is set in same scope', () => {
      const responses = [
        createResponse({
          linkId: 'link1',
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({
          linkId: 'link2',
          defaultLinkType: true,
          mimeType: 'application/json',
        }),
      ];

      recalculateDefaultFlags(responses);

      // link2 is last with defaultLinkType: true, so it wins
      expect(responses[0].defaultLinkType).toBe(false);
      expect(responses[1].defaultLinkType).toBe(true);

      // link1 keeps scoped defaults where link2 doesn't claim them
      expect(responses[0].defaultIanaLanguage).toBe(true);
      expect(responses[0].defaultContext).toBe(true);

      // For defaultMimeType: both are in same linkType+lang+context scope
      // link1 had it, link2 didn't claim it, so link1 keeps it
      expect(responses[0].defaultMimeType).toBe(true);
      expect(responses[1].defaultMimeType).toBe(false);
    });

    it('should not disturb existing defaults when non-default fields change', () => {
      const responses = [
        createResponse({
          linkId: 'link1',
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
          title: 'Updated Title',
        }),
        createResponse({
          linkId: 'link2',
          linkType: 'gs1:epcis',
        }),
      ];

      recalculateDefaultFlags(responses);

      // link1 keeps its defaults
      expect(responses[0].defaultLinkType).toBe(true);
      expect(responses[0].defaultIanaLanguage).toBe(true);
      expect(responses[0].defaultContext).toBe(true);
      expect(responses[0].defaultMimeType).toBe(true);

      // link2 is in a different linkType scope, gets its own scoped defaults
      expect(responses[1].defaultLinkType).toBe(false);
      expect(responses[1].defaultIanaLanguage).toBe(true);
      expect(responses[1].defaultContext).toBe(true);
      expect(responses[1].defaultMimeType).toBe(true);
    });
  });
});
