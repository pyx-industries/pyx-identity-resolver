import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CommonService } from './common.service';
import { gs1LinkTypes } from '../link-registration/constants/gs1-link-types';
import { untpLinkTypes } from '../link-registration/constants/untp-link-types';
import { I18nService } from 'nestjs-i18n';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';

const RESOLVER_DOMAIN = 'http://localhost:3000';
const APP_NAME = 'Test App';

const mockI18nService = {
  translate: jest.fn().mockResolvedValue('translated message'),
};

describe('CommonService', () => {
  let service: CommonService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<CommonService>(CommonService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return resolver description with gs1 and untp link type vocabularies', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_NAME') return APP_NAME;
      if (key === 'RESOLVER_DOMAIN') return RESOLVER_DOMAIN;
      return null;
    });

    const result = await service.transformResolverData();
    expect(result).toEqual({
      name: APP_NAME,
      resolverRoot: RESOLVER_DOMAIN,
      supportedLinkType: [
        {
          namespace: 'http://gs1.org/voc/',
          prefix: 'gs1:',
          profile: `${RESOLVER_DOMAIN}/voc/?show=linktypes`,
        },
        {
          namespace: 'https://vocabulary.uncefact.org/untp/linkType#',
          prefix: 'untp:',
          profile: `${RESOLVER_DOMAIN}/voc/?show=linktypes`,
        },
      ],
      supportedPrimaryKeys: ['all'],
    });
  });

  it('should get link types grouped by prefix', () => {
    const result = service.getLinkTypes();
    expect(result).toEqual({
      gs1: gs1LinkTypes,
      untp: untpLinkTypes,
    });
  });

  it('should get link types filtered by prefix', () => {
    const result = service.getLinkTypes('gs1');
    expect(result).toEqual({ gs1: gs1LinkTypes });
  });

  it('should get link types filtered by untp prefix', () => {
    const result = service.getLinkTypes('untp');
    expect(result).toEqual({ untp: untpLinkTypes });
  });

  it('should return empty object for unknown prefix', () => {
    const result = service.getLinkTypes('unknown');
    expect(result).toEqual({});
  });

  it('should get a gs1 link type by key', () => {
    const result = service.getSpecificLinkType('epcis');
    expect(result).toEqual(gs1LinkTypes['epcis']);
  });

  it('should get a untp link type by key', () => {
    const result = service.getSpecificLinkType('dpp');
    expect(result).toEqual(untpLinkTypes['dpp']);
  });

  it('should throw error if APP_NAME is not defined', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_NAME') return '';
      if (key === 'RESOLVER_DOMAIN') return 'http://localhost:3000';
      return null;
    });

    await expect(service.transformResolverData()).rejects.toThrowError(
      'APP_NAME is not defined',
    );
  });

  it('should throw error if RESOLVER_DOMAIN is not defined', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_NAME') return 'Test App';
      if (key === 'RESOLVER_DOMAIN') return '';
      return null;
    });

    await expect(service.transformResolverData()).rejects.toThrowError(
      'RESOLVER_DOMAIN is not defined',
    );
  });

  it('should throw error if link type is not valid', () => {
    expect(() => service.getSpecificLinkType('example')).toThrow(
      GeneralErrorException,
    );
  });
});
