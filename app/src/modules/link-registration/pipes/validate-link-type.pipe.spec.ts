import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { ValidateLinkTypePipe } from './validate-link-type.pipe';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

const makeDto = (
  overrides: Partial<CreateLinkRegistrationDto> & {
    linkType?: string;
  } = {},
): CreateLinkRegistrationDto => ({
  namespace: 'gs1',
  identificationKeyType: 'gtin',
  identificationKey: '12345678901234',
  description: 'Product description',
  qualifierPath: '/10/LOT1234/21/SER5678',
  active: true,
  responses: [
    {
      linkType: overrides.linkType ?? 'gs1:certificationInfo',
      defaultLinkType: true,
      defaultMimeType: true,
      fwqs: false,
      active: true,
      title: 'Certification Information',
      targetUrl: 'https://example.com',
      mimeType: 'application/json',
      ianaLanguage: 'en',
      context: 'au',
      defaultContext: true,
      defaultIanaLanguage: true,
    },
  ],
  ...overrides,
});

describe('ValidateLinkTypePipe', () => {
  let pipe: ValidateLinkTypePipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateLinkTypePipe,
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<ValidateLinkTypePipe>(ValidateLinkTypePipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should validate a gs1-prefixed link type', async () => {
    const dto = makeDto({ linkType: 'gs1:certificationInfo' });
    const result = await pipe.transform(dto);
    expect(result).toEqual(dto);
  });

  it('should validate a untp-prefixed link type', async () => {
    const dto = makeDto({ linkType: 'untp:dpp' });
    const result = await pipe.transform(dto);
    expect(result).toEqual(dto);
  });

  it('should reject a untp link type key used with gs1 prefix', async () => {
    const dto = makeDto({ linkType: 'gs1:dpp' });
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should reject a gs1 link type key used with untp prefix', async () => {
    const dto = makeDto({ linkType: 'untp:certificationInfo' });
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should reject an unregistered link type key', async () => {
    const dto = makeDto({ linkType: 'gs1:totallyFakeLinkType' });
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should reject an unknown prefix', async () => {
    const dto = makeDto({ linkType: 'custom:certificationInfo' });
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should reject a link type without a prefix', async () => {
    const dto = makeDto({ linkType: 'certificationInfo' });
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });
});
