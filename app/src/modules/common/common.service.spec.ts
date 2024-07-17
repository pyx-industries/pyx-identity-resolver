import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CommonService } from './common.service';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { defaultLinkTypes } from './data/default-link-types';
import { IdentifierDto } from '../identifier-management/dto/identifier.dto';
import { I18nService } from 'nestjs-i18n';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';

const RESOLVER_DOMAIN = 'http://localhost:3000';
const APP_NAME = 'Test App';

const mockI18nService = {
  translate: jest.fn().mockResolvedValue('translated message'),
};

describe('CommonService Success Cases', () => {
  let service: CommonService;
  let configService: ConfigService;
  let identifierService: IdentifierManagementService;
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
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifiers: jest.fn().mockResolvedValue({
              example: {
                namespace: 'example',
              },
            }),
          },
        },
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    service = module.get<CommonService>(CommonService);
    configService = module.get<ConfigService>(ConfigService);
    identifierService = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly map supported link types with default values', async () => {
    const mockIdentifiers: IdentifierDto[] = [
      {
        namespace: 'example',
        namespaceURI: null,
        namespaceProfile: null,
        applicationIdentifiers: [],
      },
    ];

    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_NAME') return APP_NAME;
      if (key === 'RESOLVER_DOMAIN') return RESOLVER_DOMAIN;
      return null;
    });

    jest
      .spyOn(identifierService, 'getIdentifiers')
      .mockResolvedValue(mockIdentifiers);

    const result = await service.transformResolverData();
    expect(result).toEqual({
      name: APP_NAME,
      resolverRoot: RESOLVER_DOMAIN,
      supportedLinkType: [
        {
          namespace: `${RESOLVER_DOMAIN}/voc/`,
          prefix: 'example:',
          profile: `${RESOLVER_DOMAIN}/voc/?show=linktypes`,
        },
      ],
      supportedPrimaryKeys: ['all'],
    });
  });

  it('should correctly map supported link types with provided values', async () => {
    const mockIdentifiers: IdentifierDto[] = [
      {
        namespace: 'gs1',
        namespaceURI: 'http://gs1.org/voc/',
        namespaceProfile: 'https://www.gs1.org/voc/?show=linktypes',
        applicationIdentifiers: [],
      },
      {
        namespace: 'integrity-system',
        namespaceURI: 'http://integrity-system.org/',
        namespaceProfile: 'http://integrity-system.org/?show=linktypes',
        applicationIdentifiers: [],
      },
    ];

    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_NAME') return APP_NAME;
      if (key === 'RESOLVER_DOMAIN') return RESOLVER_DOMAIN;
      return null;
    });

    jest
      .spyOn(identifierService, 'getIdentifiers')
      .mockResolvedValue(mockIdentifiers);

    const result = await service.transformResolverData();

    expect(result).toEqual({
      name: APP_NAME,
      resolverRoot: RESOLVER_DOMAIN,
      supportedLinkType: [
        {
          namespace: 'http://gs1.org/voc/',
          prefix: 'gs1:',
          profile: 'https://www.gs1.org/voc/?show=linktypes',
        },
        {
          namespace: 'http://integrity-system.org/',
          prefix: 'integrity-system:',
          profile: 'http://integrity-system.org/?show=linktypes',
        },
      ],
      supportedPrimaryKeys: ['all'],
    });
  });

  it('should get default link types', () => {
    const result = service.getLinkTypes();
    expect(result).toEqual(defaultLinkTypes);
  });

  it('should get specific link type', () => {
    const linkType = 'epcis';
    const result = service.getSpecificLinkType(linkType);
    expect(result).toEqual(defaultLinkTypes[linkType]);
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
    const linkType = 'example';
    try {
      service.getSpecificLinkType(linkType);
    } catch (error) {
      expect(error).toBeInstanceOf(GeneralErrorException);
      expect(mockI18nService.translate).toHaveBeenCalledWith(
        'errors.invalid_voc_linktype',
        { args: undefined, lang: 'en' },
      );
    }
  });
});
