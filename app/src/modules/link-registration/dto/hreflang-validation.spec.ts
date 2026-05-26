import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Response } from './link-registration.dto';
import { ListLinksQueryDto, UpdateLinkDto } from './link-management.dto';

const baseResponse = {
  defaultLinkType: true,
  defaultMimeType: true,
  defaultContext: true,
  fwqs: false,
  active: true,
  linkType: 'example-identifier-scheme:certificationInfo',
  context: 'au',
  title: 'Certification Information',
  targetUrl: 'https://example.com',
  mimeType: 'application/json',
};

// Each row is wrapped in an outer array so it.each treats the inner array
// as a single column value rather than unpacking its elements as args.
const acceptedHreflangRows: [string[]][] = [
  [['en']],
  [['en', 'fr', 'de']],
  [['en-GB']],
  [['en-US', 'es-MX']],
  [[]],
];

const rejectedHreflangRows: [string[]][] = [
  [['eng']],
  [['']],
  [['en_US']],
  [['en-USA']],
];

describe('hreflang validation', () => {
  describe('Response (POST /resolver)', () => {
    it.each(acceptedHreflangRows)('accepts %j', async (hreflang) => {
      const dto = plainToInstance(Response, { ...baseResponse, hreflang });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeUndefined();
    });

    it.each(rejectedHreflangRows)('rejects %j', async (hreflang) => {
      const dto = plainToInstance(Response, { ...baseResponse, hreflang });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeDefined();
    });

    it('rejects a non-array hreflang value', async () => {
      const dto = plainToInstance(Response, {
        ...baseResponse,
        hreflang: 'en' as any,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeDefined();
    });
  });

  describe('UpdateLinkDto (PUT /resolver/links/:linkId)', () => {
    it.each(acceptedHreflangRows)('accepts %j', async (hreflang) => {
      const dto = plainToInstance(UpdateLinkDto, { hreflang });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeUndefined();
    });

    it.each(rejectedHreflangRows)('rejects %j', async (hreflang) => {
      const dto = plainToInstance(UpdateLinkDto, { hreflang });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeDefined();
    });
  });

  describe('ListLinksQueryDto (GET /resolver/links?hreflang=...)', () => {
    const baseQuery = {
      namespace: 'example',
      identificationKeyType: 'gtin',
      identificationKey: '12345678901234',
    };

    const acceptedQueryRows: string[] = ['en', 'en-US', 'fr', 'en-GB'];
    const rejectedQueryRows: string[] = ['eng', 'en_US', 'en-USA', ''];

    it('accepts an absent hreflang', async () => {
      const dto = plainToInstance(ListLinksQueryDto, { ...baseQuery });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeUndefined();
    });

    it.each(acceptedQueryRows)('accepts %j', async (hreflang) => {
      const dto = plainToInstance(ListLinksQueryDto, {
        ...baseQuery,
        hreflang,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeUndefined();
    });

    it.each(rejectedQueryRows)('rejects %j', async (hreflang) => {
      const dto = plainToInstance(ListLinksQueryDto, {
        ...baseQuery,
        hreflang,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeDefined();
    });

    it('rejects an array value', async () => {
      const dto = plainToInstance(ListLinksQueryDto, {
        ...baseQuery,
        hreflang: ['en'] as any,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'hreflang')).toBeDefined();
    });
  });
});
