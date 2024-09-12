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
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn().mockResolvedValue({
              namespace: 'testNamespace',
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
});
