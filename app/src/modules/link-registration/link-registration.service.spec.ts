import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { LinkRegistrationService } from './link-registration.service';
import { IRepositoryProvider } from 'src/repository/providers/provider.repository.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ConfigModule } from '@nestjs/config';
import { IdentifierDto } from '../identifier-management/dto/identifier.dto';

describe('LinkRegistrationService', () => {
  let service: LinkRegistrationService;
  let repositoryProvider: IRepositoryProvider;
  let identifierService: IdentifierManagementService;

  beforeEach(async () => {
    // Creates a testing module for the LinkRegistrationService.
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        LinkRegistrationService,
        {
          provide: 'RepositoryProvider',
          useValue: {
            one: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn().mockImplementation((key) => key),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn().mockResolvedValue({
              namespace: 'testNamespace',
              namespaceURI: 'https://namespace.uri/voc',
              namespaceProfile: 'https://namespace.uri/voc/?show=linktypes',
              applicationIdentifiers: [
                {
                  ai: '01',
                  regex: '^.*$',
                  type: 'I',
                  qualifiers: ['10'],
                },
                {
                  ai: '10',
                  regex: '^.*$',
                  type: 'Q',
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    // Get the LinkRegistrationService and the RepositoryProvider instance from the testing module.
    service = module.get<LinkRegistrationService>(LinkRegistrationService);
    repositoryProvider = module.get<IRepositoryProvider>('RepositoryProvider');
    identifierService = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save the registration and return success message', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      const result = await service.create(payload);

      expect(result).toEqual({
        message: 'successes.register_link_resolver_successfully',
      });
    });

    it('should save the registration with default link type voc', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };

      const mockIdentifier: IdentifierDto = {
        namespace: 'gs1',
        namespaceURI: '',
        namespaceProfile: '',
        applicationIdentifiers: [],
      };

      jest
        .spyOn(
          identifierService,
          'getIdentifier' as keyof IdentifierManagementService,
        )
        .mockResolvedValue(mockIdentifier);

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      const result = await service.create(payload);

      expect(result).toEqual({
        message: 'successes.register_link_resolver_successfully',
      });
    });

    it("should throw an exception if the repositoryProvider's save method throws an error", async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest
        .spyOn(repositoryProvider, 'save')
        .mockRejectedValue(new Error('Test error'));

      await expect(service.create(payload)).rejects.toThrow();
    });

    it('should throw an exception if the resolverDomain configuration is missing', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };

      await expect(service.create(payload)).rejects.toThrow(
        'Missing configuration for RESOLVER_DOMAIN',
      );
    });

    it('should generate linkIds only for new responses without existing linkIds', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Info',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
          },
          {
            targetUrl: 'https://example.com/safety',
            linkType: 'gs1:safety',
            title: 'Safety Info',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultMimeType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall.responses).toHaveLength(2);
      expect(saveCall.responses[0].linkId).toBeDefined();
      expect(saveCall.responses[1].linkId).toBeDefined();
      expect(saveCall.responses[0].linkId).not.toBe(
        saveCall.responses[1].linkId,
      );
    });

    it('should preserve existing linkIds and only assign new ones to responses without linkIds', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/existing',
            linkType: 'gs1:pip',
            title: 'Existing',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            linkId: 'existing-link-id-abc',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            targetUrl: 'https://example.com/new',
            linkType: 'gs1:safety',
            title: 'New',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultMimeType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      // Existing response keeps its linkId
      expect(saveCall.responses[0].linkId).toBe('existing-link-id-abc');
      // New response gets a generated linkId
      expect(saveCall.responses[1].linkId).toBeDefined();
      expect(saveCall.responses[1].linkId).not.toBe('existing-link-id-abc');
    });

    it('should call writeLinkIndex only for new responses', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/existing',
            linkType: 'gs1:pip',
            title: 'Existing',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            linkId: 'existing-link-id-abc',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            targetUrl: 'https://example.com/new',
            linkType: 'gs1:safety',
            title: 'New',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultMimeType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest.spyOn(repositoryProvider, 'one').mockResolvedValue({
        version: 1,
        createdAt: '2020-01-01T00:00:00.000Z',
        responses: [],
      });

      await service.create(payload);

      // save is called once for the main document + once for the NEW response index only
      const saveCalls = (repositoryProvider.save as jest.Mock).mock.calls;
      const indexCalls = saveCalls.filter(
        (call) =>
          typeof call[0].id === 'string' &&
          call[0].id.includes('_index/links/'),
      );
      // Only 1 index entry (for the new response), not 2
      expect(indexCalls).toHaveLength(1);
    });

    it('should increment version for existing documents', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest.spyOn(repositoryProvider, 'one').mockResolvedValue({
        version: 3,
        createdAt: '2020-01-01T00:00:00.000Z',
        responses: [],
      });

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall.version).toBe(4);
    });

    it('should preserve createdAt from existing documents', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest.spyOn(repositoryProvider, 'one').mockResolvedValue({
        version: 1,
        createdAt: '2020-01-01T00:00:00.000Z',
        responses: [],
      });

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall.createdAt).toBe('2020-01-01T00:00:00.000Z');
    });

    it('should NOT delete old link index entries when adding to existing document', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Info',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest.spyOn(repositoryProvider, 'one').mockResolvedValue({
        version: 1,
        createdAt: '2020-01-01T00:00:00.000Z',
        responses: [{ linkId: 'old-link-id-1' }, { linkId: 'old-link-id-2' }],
      });

      await service.create(payload);

      // No deletions should occur — existing indexes are preserved
      const deleteCalls = (repositoryProvider.delete as jest.Mock).mock.calls;
      expect(deleteCalls).toHaveLength(0);
    });

    it('should record version history for additive operations', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Info',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest.spyOn(repositoryProvider, 'one').mockResolvedValue({
        version: 2,
        createdAt: '2020-01-01T00:00:00.000Z',
        responses: [],
        versionHistory: [],
      });

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall.versionHistory).toBeDefined();
      expect(saveCall.versionHistory).toHaveLength(1);
      expect(saveCall.versionHistory[0].version).toBe(3);
      expect(saveCall.versionHistory[0].changes).toHaveLength(1);
      expect(saveCall.versionHistory[0].changes[0].action).toBe('created');
      expect(saveCall.versionHistory[0].changes[0].linkId).toBeDefined();
    });

    it('should not record version history for new documents', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Info',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultMimeType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
          },
        ],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      // No existing document
      jest.spyOn(repositoryProvider, 'one').mockResolvedValue(undefined);

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall.versionHistory).toEqual([]);
    });

    it('should include versionHistory in the saved document', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall).toHaveProperty('versionHistory');
    });

    it('should not include linkHeaderText in saved document', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      await service.create(payload);

      const saveCall = (repositoryProvider.save as jest.Mock).mock.calls[0][0];
      expect(saveCall).not.toHaveProperty('linkHeaderText');
    });
  });
});
