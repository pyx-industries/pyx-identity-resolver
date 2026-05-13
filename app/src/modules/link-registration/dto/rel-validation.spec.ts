import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Response } from './link-registration.dto';
import { UpdateLinkDto } from './link-management.dto';

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
  mimeType: 'application/json',
};

describe('rel validation', () => {
  describe('Response (POST /resolver)', () => {
    it('accepts an opaque rel value', async () => {
      const dto = plainToInstance(Response, {
        ...baseResponse,
        rel: ['edit'],
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'rel')).toBeUndefined();
      expect(dto.rel).toEqual(['edit']);
    });

    it('strips server-reserved `predecessor-version` from input', async () => {
      const dto = plainToInstance(Response, {
        ...baseResponse,
        rel: ['edit', 'predecessor-version', 'latest-version'],
      });
      expect(dto.rel).toEqual(['edit', 'latest-version']);
    });

    it('reduces to an empty array when only `predecessor-version` is supplied', async () => {
      const dto = plainToInstance(Response, {
        ...baseResponse,
        rel: ['predecessor-version'],
      });
      expect(dto.rel).toEqual([]);
    });

    it('rejects a non-array rel value', async () => {
      const dto = plainToInstance(Response, {
        ...baseResponse,
        rel: 'edit' as any,
      });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'rel')).toBeDefined();
    });
  });

  describe('UpdateLinkDto (PUT /resolver/links/:linkId)', () => {
    it('accepts an opaque rel value', async () => {
      const dto = plainToInstance(UpdateLinkDto, { rel: ['edit'] });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'rel')).toBeUndefined();
      expect(dto.rel).toEqual(['edit']);
    });

    it('strips server-reserved `predecessor-version` from input', async () => {
      const dto = plainToInstance(UpdateLinkDto, {
        rel: ['edit', 'predecessor-version'],
      });
      expect(dto.rel).toEqual(['edit']);
    });

    it('accepts an empty rel array (clears the field)', async () => {
      const dto = plainToInstance(UpdateLinkDto, { rel: [] });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'rel')).toBeUndefined();
      expect(dto.rel).toEqual([]);
    });

    it('accepts rel: null and passes it through (treated as absent at the linkset boundary)', async () => {
      const dto = plainToInstance(UpdateLinkDto, { rel: null });
      const errors = await validate(dto);
      expect(errors.find((e) => e.property === 'rel')).toBeUndefined();
      expect(dto.rel).toBeNull();
    });
  });
});
