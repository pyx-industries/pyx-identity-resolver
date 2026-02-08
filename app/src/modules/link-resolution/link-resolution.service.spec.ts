import { Test, TestingModule } from '@nestjs/testing';
import { LinkResolutionService } from './link-resolution.service';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import {
  i18nServiceMockFactory,
  repositoryProviderMockFactory,
} from '../../__mocks__/mock.factories';
import { LinkResolutionDto } from './dto/link-resolution.dto';
import { MockType } from '../../__mocks__/mock.interface';
import { Uri } from './interfaces/uri.interface';
import { I18nService } from 'nestjs-i18n';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ConfigService } from '@nestjs/config';

describe('LinkResolutionService', () => {
  let service: LinkResolutionService;
  let mockRepository: MockType<IRepositoryProvider>;
  let mockI18nService: MockType<I18nService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        LinkResolutionService,
        {
          provide: 'RepositoryProvider',
          useFactory: repositoryProviderMockFactory,
        },
        {
          provide: I18nService,
          useFactory: i18nServiceMockFactory,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RESOLVER_DOMAIN')
                return 'http://localhost:3002/api/1.0.0';
              return undefined;
            }),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn().mockResolvedValue({
              namespace: 'testNamespace',
              namespaceURI: '',
              applicationIdentifiers: [
                {
                  ai: '01',
                  shortcode: 'primary',
                  regex: '^.*$',
                  type: 'I',
                  qualifiers: ['10'],
                },
                {
                  ai: '10',
                  shortcode: 'secondary',
                  regex: '^.*$',
                  type: 'Q',
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LinkResolutionService>(LinkResolutionService);
    mockRepository = module.get('RepositoryProvider');
    mockI18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should resolve a link', async () => {
    const identifierParams: LinkResolutionDto = {
      namespace: 'idr',
      identifiers: {
        primary: {
          id: '123',
          qualifier: '01',
        },
        secondaries: [
          {
            id: '456',
            qualifier: 'secondary',
          },
        ],
      },
      descriptiveAttributes: {
        linkType: 'idr:certificationInfo',
        ianaLanguage: 'en',
        context: 'us',
        mimeType: 'application/json',
      },
    };

    const mockUri: Uri = {
      id: '123',
      namespace: 'idr',
      identificationKeyType: 'primary',
      identificationKey: '123',
      itemDescription: '',
      qualifierPath: '/10/456',
      active: true,
      responses: [
        {
          targetUrl: 'http://example-json.com',
          title: 'Passport',
          linkType: 'idr:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
          active: true,
          fwqs: false,
          defaultLinkType: false,
          defaultIanaLanguage: false,
          defaultContext: false,
          defaultMimeType: false,
        },
      ],
      linkset: undefined,
      linkHeaderText: '',
    };

    mockRepository.one.mockReturnValue(mockUri);

    const result = await service.resolve(identifierParams);

    expect(result).toEqual({
      targetUrl: 'http://example-json.com',
      mimeType: 'application/json',
      data: { linkset: [] },
      fwqs: false,
      linkHeaderText: '',
    });
  });

  it('should throw an error if no link is found', async () => {
    const identifierParams: LinkResolutionDto = {
      namespace: 'idr',
      identifiers: {
        primary: {
          id: '123',
          qualifier: '01',
        },
      },
      descriptiveAttributes: {},
    };

    mockRepository.one.mockReturnValue(undefined);
    const resolve = service.resolve(identifierParams);

    await expect(resolve).rejects.toThrow('General Error Exception');

    expect(mockI18nService.translate).toHaveBeenCalledWith(
      'errors.cannot_resolve_link',
      {
        args: undefined,
        lang: 'en',
      },
    );
  });

  describe('accessRole filtering', () => {
    const baseMockUri: Uri = {
      id: '123',
      namespace: 'idr',
      identificationKeyType: 'primary',
      identificationKey: '123',
      itemDescription: '',
      qualifierPath: '/',
      active: true,
      responses: [
        {
          targetUrl: 'http://public.com',
          title: 'Public DPP',
          linkType: 'idr:dpp',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
          active: true,
          fwqs: false,
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
        },
        {
          targetUrl: 'http://customer.com',
          title: 'Customer DCC',
          linkType: 'idr:dcc',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
          active: true,
          fwqs: false,
          defaultLinkType: false,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
          accessRole: ['untp:accessRole#Customer'],
        },
        {
          targetUrl: 'http://regulator.com',
          title: 'Regulator DCC',
          linkType: 'idr:dcc',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
          active: true,
          fwqs: false,
          defaultLinkType: false,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
          accessRole: ['untp:accessRole#Regulator'],
        },
      ],
      linkset: { anchor: 'http://localhost:3002/api/1.0.0/idr/01/123' },
      linkHeaderText: '<http://public.com>; rel="idr:dpp"',
    };

    it('should resolve without filtering when no accessRole provided', async () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: { linkType: 'idr:dpp' },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(baseMockUri)),
      );
      const result = await service.resolve(identifierParams);

      expect(result.targetUrl).toBe('http://public.com');
      // No accessRole => uses pre-stored linkset/linkHeader
      expect(result.linkHeaderText).toBe('<http://public.com>; rel="idr:dpp"');
    });

    it('should filter responses by accessRole shorthand and resolve customer-only linkType', async () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: {
          linkType: 'idr:dcc',
          accessRole: 'customer',
        },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(baseMockUri)),
      );
      const result = await service.resolve(identifierParams);

      // Customer link matches idr:dcc; regulator link filtered out
      expect(result.targetUrl).toBe('http://customer.com');
    });

    it('should reconstruct linkset when accessRole filtering is active', async () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: {
          linkType: 'idr:dcc',
          accessRole: 'customer',
        },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(baseMockUri)),
      );
      const result = await service.resolve(identifierParams);

      expect(result.data.linkset).not.toEqual([baseMockUri.linkset]);
      expect(result.data.linkset[0].anchor).toBeDefined();
      expect(result.linkHeaderText).toContain('http://customer.com');
      expect(result.linkHeaderText).not.toContain('http://regulator.com');
    });

    it('should filter by full URI accessRole', async () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: {
          linkType: 'idr:dcc',
          accessRole: 'untp:accessRole#Customer',
        },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(baseMockUri)),
      );
      const result = await service.resolve(identifierParams);

      expect(result.targetUrl).toBe('http://customer.com');
    });

    it('should return only public links for unknown accessRole', async () => {
      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: {
          linkType: 'idr:dpp',
          accessRole: 'unknown',
        },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(baseMockUri)),
      );
      const result = await service.resolve(identifierParams);

      // Only public link (no accessRole) should match idr:dpp
      expect(result.targetUrl).toBe('http://public.com');
    });

    it('should throw when accessRole filter excludes all responses', async () => {
      const noPublicUri: Uri = {
        ...baseMockUri,
        responses: [
          {
            targetUrl: 'http://regulator.com',
            title: 'Regulator Only',
            linkType: 'idr:dpp',
            ianaLanguage: 'en',
            context: 'us',
            mimeType: 'application/json',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            accessRole: ['untp:accessRole#Regulator'],
          },
        ],
      };

      const identifierParams: LinkResolutionDto = {
        namespace: 'idr',
        identifiers: { primary: { id: '123', qualifier: '01' } },
        descriptiveAttributes: {
          linkType: 'idr:dpp',
          accessRole: 'customer',
        },
      };

      mockRepository.one.mockReturnValue(
        JSON.parse(JSON.stringify(noPublicUri)),
      );

      await expect(service.resolve(identifierParams)).rejects.toThrow(
        'General Error Exception',
      );
    });
  });
});
