import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Response } from './link-registration.dto';
import { ListLinksQueryDto, UpdateLinkDto } from './link-management.dto';

const baseResponse = {
  defaultLinkType: true,
  defaultMimeType: true,
  defaultIanaLanguage: true,
  defaultContext: true,
  fwqs: false,
  active: true,
  linkType: 'example-identifier-scheme:certificationInfo',
  ianaLanguage: 'en',
  context: 'au',
  title: 'Certification Information',
  targetUrl: 'https://example.com',
};

const acceptedMimeTypes = [
  'application/vc+ld+json',
  'application/linkset+json',
  'application/ld+json',
  'application/json',
  'text/html',
  'image/svg+xml',
];

const rejectedMimeTypes = [
  'not-a-mime-type',
  'application/',
  '/json',
  'application/json/extra',
  '',
  'application json',
];

describe('mimeType validation', () => {
  describe('Response (POST /resolver)', () => {
    it.each(acceptedMimeTypes)('accepts %s', async (mimeType) => {
      const dto = plainToInstance(Response, { ...baseResponse, mimeType });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeUndefined();
    });

    it.each(rejectedMimeTypes)('rejects %p', async (mimeType) => {
      const dto = plainToInstance(Response, { ...baseResponse, mimeType });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeDefined();
    });
  });

  describe('UpdateLinkDto (PUT /resolver/links/:linkId)', () => {
    it.each(acceptedMimeTypes)('accepts %s', async (mimeType) => {
      const dto = plainToInstance(UpdateLinkDto, { mimeType });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeUndefined();
    });

    it.each(rejectedMimeTypes)('rejects %p', async (mimeType) => {
      const dto = plainToInstance(UpdateLinkDto, { mimeType });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeDefined();
    });
  });

  describe('ListLinksQueryDto (GET /resolver/links?mimeType=...)', () => {
    const baseQuery = {
      namespace: 'example-identifier-scheme',
      identificationKeyType: 'gtin',
      identificationKey: '12345678901234',
    };

    it('accepts an absent mimeType filter', async () => {
      const dto = plainToInstance(ListLinksQueryDto, baseQuery);
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeUndefined();
    });

    it.each(acceptedMimeTypes)('accepts %s', async (mimeType) => {
      const dto = plainToInstance(ListLinksQueryDto, {
        ...baseQuery,
        mimeType,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeUndefined();
    });

    it.each(rejectedMimeTypes)('rejects %p', async (mimeType) => {
      const dto = plainToInstance(ListLinksQueryDto, {
        ...baseQuery,
        mimeType,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'mimeType')).toBeDefined();
    });
  });
});
