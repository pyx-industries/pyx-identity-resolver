import {
  CreateLinkRegistrationDto,
  Response,
} from '../dto/link-registration.dto';
import { DefaultFlagsTransformPipe } from './default-flags-transform.pipe';

describe('DefaultFlagsTransformPipe', () => {
  let pipe: DefaultFlagsTransformPipe;

  beforeEach(() => {
    pipe = new DefaultFlagsTransformPipe();
  });

  const createResponse = (overrides: Partial<Response> = {}): Response => ({
    defaultLinkType: false,
    defaultMimeType: false,
    defaultIanaLanguage: false,
    defaultContext: false,
    fwqs: false,
    active: true,
    linkType: 'gs1:certificationInfo',
    title: 'Test',
    targetUrl: 'https://example.com',
    mimeType: 'application/json',
    ianaLanguage: 'en',
    context: 'au',
    ...overrides,
  });

  const createDto = (responses: Response[]): CreateLinkRegistrationDto => ({
    namespace: 'gs1',
    identificationKeyType: 'gtin',
    identificationKey: '12345678901234',
    itemDescription: 'Test product',
    qualifierPath: '/',
    active: true,
    responses,
  });

  describe('payload with no duplicate defaults', () => {
    it('should promote first active response when no defaults are set', () => {
      const dto = createDto([
        createResponse(),
        createResponse({ linkType: 'gs1:epcis' }),
      ]);

      const result = pipe.transform(dto);

      // First active response promoted as default in its scope
      expect(result.responses[0].defaultLinkType).toBe(true);
      expect(result.responses[0].defaultIanaLanguage).toBe(true);
      expect(result.responses[0].defaultContext).toBe(true);
      expect(result.responses[0].defaultMimeType).toBe(true);

      // Second response promoted in its own linkType scope
      expect(result.responses[1].defaultLinkType).toBe(false);
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
      expect(result.responses[1].defaultContext).toBe(true);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });

    it('should pass unchanged when only one response has defaults', () => {
      const dto = createDto([
        createResponse({
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({ linkType: 'gs1:epcis' }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultLinkType).toBe(true);
      expect(result.responses[0].defaultIanaLanguage).toBe(true);
      expect(result.responses[0].defaultContext).toBe(true);
      expect(result.responses[0].defaultMimeType).toBe(true);
    });

    it('should pass unchanged when defaults are in different scopes', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:epcis',
          ianaLanguage: 'fr',
          context: 'us',
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      // First response keeps all its defaults
      expect(result.responses[0].defaultLinkType).toBe(true);
      expect(result.responses[0].defaultIanaLanguage).toBe(true);
      expect(result.responses[0].defaultContext).toBe(true);
      expect(result.responses[0].defaultMimeType).toBe(true);

      // Second response in different scope also keeps its defaults (except defaultLinkType which is global)
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
      expect(result.responses[1].defaultContext).toBe(true);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('defaultLinkType - global scope', () => {
    it('should keep only the last defaultLinkType true when duplicates exist', () => {
      const dto = createDto([
        createResponse({ defaultLinkType: true }),
        createResponse({ linkType: 'gs1:epcis', defaultLinkType: true }),
        createResponse({ linkType: 'gs1:pip', defaultLinkType: true }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultLinkType).toBe(false);
      expect(result.responses[1].defaultLinkType).toBe(false);
      expect(result.responses[2].defaultLinkType).toBe(true);
    });

    it('should preserve non-defaultLinkType values', () => {
      const dto = createDto([
        createResponse({ defaultLinkType: true }),
        createResponse({ linkType: 'gs1:epcis' }),
        createResponse({ linkType: 'gs1:pip', defaultLinkType: true }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultLinkType).toBe(false);
      expect(result.responses[1].defaultLinkType).toBe(false);
      expect(result.responses[2].defaultLinkType).toBe(true);
    });
  });

  describe('defaultIanaLanguage - per linkType scope', () => {
    it('should keep only the last defaultIanaLanguage true for same linkType', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'fr',
          defaultIanaLanguage: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultIanaLanguage).toBe(false);
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
    });

    it('should allow different linkTypes to each have their own defaultIanaLanguage', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:epcis',
          defaultIanaLanguage: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultIanaLanguage).toBe(true);
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
    });
  });

  describe('defaultContext - per linkType + ianaLanguage scope', () => {
    it('should keep only the last defaultContext true for same linkType and language', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          defaultContext: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultContext).toBe(false);
      expect(result.responses[1].defaultContext).toBe(true);
    });

    it('should allow different linkType+language combinations to each have their own defaultContext', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'fr',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:epcis',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultContext).toBe(true);
      expect(result.responses[1].defaultContext).toBe(true);
      expect(result.responses[2].defaultContext).toBe(true);
    });
  });

  describe('defaultMimeType - per linkType + ianaLanguage + context scope', () => {
    it('should keep only the last defaultMimeType true for same full scope', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'text/html',
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultMimeType).toBe(false);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });

    it('should allow different full scopes to each have their own defaultMimeType', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultMimeType).toBe(true);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('should treat ianaLanguage case-insensitively for defaultContext scope', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'EN',
          context: 'au',
          defaultContext: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          defaultContext: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultContext).toBe(false);
      expect(result.responses[1].defaultContext).toBe(true);
    });

    it('should treat context case-insensitively for defaultMimeType scope', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'AU',
          mimeType: 'application/json',
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'text/html',
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultMimeType).toBe(false);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });

    it('should treat ianaLanguage case-insensitively for defaultIanaLanguage scope', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'EN',
          defaultIanaLanguage: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          defaultIanaLanguage: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultIanaLanguage).toBe(false);
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty responses array', () => {
      const dto = createDto([]);

      const result = pipe.transform(dto);

      expect(result.responses).toEqual([]);
    });

    it('should handle single response', () => {
      const dto = createDto([
        createResponse({
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      expect(result.responses[0].defaultLinkType).toBe(true);
      expect(result.responses[0].defaultIanaLanguage).toBe(true);
      expect(result.responses[0].defaultContext).toBe(true);
      expect(result.responses[0].defaultMimeType).toBe(true);
    });

    it('should handle multiple defaults across all flags simultaneously', () => {
      const dto = createDto([
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
        createResponse({
          linkType: 'gs1:certificationInfo',
          ianaLanguage: 'en',
          context: 'au',
          mimeType: 'text/html',
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        }),
      ]);

      const result = pipe.transform(dto);

      // First response loses all defaults
      expect(result.responses[0].defaultLinkType).toBe(false);
      expect(result.responses[0].defaultIanaLanguage).toBe(false);
      expect(result.responses[0].defaultContext).toBe(false);
      expect(result.responses[0].defaultMimeType).toBe(false);

      // Second response keeps all defaults (last in each scope)
      expect(result.responses[1].defaultLinkType).toBe(true);
      expect(result.responses[1].defaultIanaLanguage).toBe(true);
      expect(result.responses[1].defaultContext).toBe(true);
      expect(result.responses[1].defaultMimeType).toBe(true);
    });
  });
});
