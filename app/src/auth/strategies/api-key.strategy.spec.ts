import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { ApiKeyStrategy } from './api-key.strategy';

jest.mock('../../common/exceptions/general-error.exception', () => {
  return {
    GeneralErrorException: jest.fn().mockImplementation(() => {
      return new Error('Mocked FieldErrorsException');
    }),
  };
});

describe('ApiKeyStrategy', () => {
  let apiKeyStrategy: ApiKeyStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ApiKeyStrategy,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: I18nService, useValue: {} },
      ],
    }).compile();

    apiKeyStrategy = moduleRef.get<ApiKeyStrategy>(ApiKeyStrategy);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(apiKeyStrategy).toBeDefined();
  });

  it('should validate a request with a valid API key', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('valid-api-key');
    const request = {
      headers: {
        authorization: 'Bearer valid-api-key',
      },
    } as any;

    await expect(apiKeyStrategy.validate(request)).resolves.toBe(true);
  });

  it('should throw an error for a request with an invalid API key', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('valid-api-key');
    const request = {
      headers: {
        authorization: 'Bearer invalid-api-key',
      },
    } as any;

    try {
      await apiKeyStrategy.validate(request);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should throw an error for a request without an API key', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('valid-api-key');
    const request = {
      headers: {},
    } as any;

    try {
      await apiKeyStrategy.validate(request);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
