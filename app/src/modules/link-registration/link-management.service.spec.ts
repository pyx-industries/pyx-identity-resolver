import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { LinkManagementService } from './link-management.service';
import { IRepositoryProvider } from 'src/repository/providers/provider.repository.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ConflictException } from '@nestjs/common';
import { GeneralErrorException } from '../../common/exceptions/general-error.exception';

describe('LinkManagementService', () => {
  let service: LinkManagementService;
  let repositoryProvider: jest.Mocked<IRepositoryProvider>;

  const mockDocument = {
    id: 'gs1/01/09359502000010.json',
    namespace: 'gs1',
    identificationKeyType: 'gtin',
    identificationKey: '09359502000010',
    itemDescription: 'Test Product',
    qualifierPath: '/',
    active: true,
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    versionHistory: [],
    responses: [
      {
        linkId: 'abc12345',
        targetUrl: 'https://example.com/product',
        linkType: 'gs1:pip',
        title: 'Product Information',
        mimeType: 'text/html',
        ianaLanguage: 'en',
        context: 'us',
        active: true,
        fwqs: false,
        defaultLinkType: true,
        defaultIanaLanguage: true,
        defaultContext: true,
        defaultMimeType: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    linkset: {},
  };

  const mockIndex = { documentPath: 'gs1/01/09359502000010.json' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        LinkManagementService,
        {
          provide: 'RepositoryProvider',
          useValue: {
            one: jest.fn(),
            save: jest.fn(),
            all: jest.fn(),
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
              namespace: 'gs1',
              namespaceURI: 'https://namespace.uri/voc',
              namespaceProfile: '',
              applicationIdentifiers: [
                {
                  ai: '01',
                  shortcode: 'gtin',
                  regex: '^.*$',
                  type: 'I',
                  qualifiers: ['10'],
                  title: 'Global Trade Item Number (GTIN)',
                  label: 'GTIN',
                },
                {
                  ai: '10',
                  shortcode: 'lot',
                  regex: '^.*$',
                  type: 'Q',
                  title: 'Batch or lot number',
                  label: 'BATCH/LOT',
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    service = module.get<LinkManagementService>(LinkManagementService);
    repositoryProvider = module.get('RepositoryProvider');

    jest
      .spyOn(service['configService'], 'get')
      .mockReturnValue('https://resolver.example.com');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listLinks', () => {
    it('should return all responses for a valid identifier', async () => {
      repositoryProvider.one.mockResolvedValue({ ...mockDocument });

      const result = await service.listLinks({
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          targetUrl: 'https://example.com/product',
          active: true,
        }),
      );
    });

    it('should include inactive responses', async () => {
      const docWithInactive = {
        ...mockDocument,
        responses: [
          ...mockDocument.responses,
          {
            linkId: 'inactive1',
            targetUrl: 'https://example.com/inactive',
            linkType: 'gs1:pip',
            title: 'Inactive Link',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: false,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };
      repositoryProvider.one.mockResolvedValue(docWithInactive);

      const result = await service.listLinks({
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      });

      expect(result).toHaveLength(2);
      expect(result.some((r) => r.active === false)).toBe(true);
    });

    it('should throw 404 when document not found', async () => {
      repositoryProvider.one.mockResolvedValue(null);

      await expect(
        service.listLinks({
          namespace: 'gs1',
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        }),
      ).rejects.toThrow(GeneralErrorException);
    });

    describe('filter support', () => {
      const multiResponseDoc = {
        ...mockDocument,
        responses: [
          {
            linkId: 'resp1',
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Information',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            linkId: 'resp2',
            targetUrl: 'https://example.com/product.json',
            linkType: 'gs1:pip',
            title: 'Product Information (JSON)',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            linkId: 'resp3',
            targetUrl: 'https://example.com/certification',
            linkType: 'gs1:certificationInfo',
            title: 'Certification Info',
            mimeType: 'text/html',
            ianaLanguage: 'fr',
            context: 'fr',
            active: true,
            fwqs: false,
            defaultLinkType: false,
            defaultIanaLanguage: false,
            defaultContext: false,
            defaultMimeType: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      const baseQuery = {
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      };

      it('should filter responses by linkType', async () => {
        repositoryProvider.one.mockResolvedValue({
          ...multiResponseDoc,
          responses: multiResponseDoc.responses.map((r) => ({ ...r })),
        });

        const result = await service.listLinks({
          ...baseQuery,
          linkType: 'gs1:pip',
        });

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.linkType === 'gs1:pip')).toBe(true);
        expect(result.map((r) => r.linkId).sort()).toEqual(
          ['resp1', 'resp2'].sort(),
        );
      });

      it('should filter responses by mimeType', async () => {
        repositoryProvider.one.mockResolvedValue({
          ...multiResponseDoc,
          responses: multiResponseDoc.responses.map((r) => ({ ...r })),
        });

        const result = await service.listLinks({
          ...baseQuery,
          mimeType: 'text/html',
        });

        expect(result).toHaveLength(2);
        expect(result.every((r) => r.mimeType === 'text/html')).toBe(true);
        expect(result.map((r) => r.linkId).sort()).toEqual(
          ['resp1', 'resp3'].sort(),
        );
      });

      it('should filter responses by ianaLanguage', async () => {
        repositoryProvider.one.mockResolvedValue({
          ...multiResponseDoc,
          responses: multiResponseDoc.responses.map((r) => ({ ...r })),
        });

        const result = await service.listLinks({
          ...baseQuery,
          ianaLanguage: 'fr',
        });

        expect(result).toHaveLength(1);
        expect(result[0].linkId).toBe('resp3');
        expect(result[0].ianaLanguage).toBe('fr');
      });

      it('should apply multiple filters simultaneously', async () => {
        repositoryProvider.one.mockResolvedValue({
          ...multiResponseDoc,
          responses: multiResponseDoc.responses.map((r) => ({ ...r })),
        });

        const result = await service.listLinks({
          ...baseQuery,
          linkType: 'gs1:pip',
          mimeType: 'text/html',
        });

        expect(result).toHaveLength(1);
        expect(result[0].linkId).toBe('resp1');
        expect(result[0].linkType).toBe('gs1:pip');
        expect(result[0].mimeType).toBe('text/html');
      });

      it('should return empty array when no responses match filter', async () => {
        repositoryProvider.one.mockResolvedValue({
          ...multiResponseDoc,
          responses: multiResponseDoc.responses.map((r) => ({ ...r })),
        });

        const result = await service.listLinks({
          ...baseQuery,
          linkType: 'gs1:nonexistent',
        });

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
      });
    });
  });

  describe('getLink', () => {
    it('should return the response matching the linkId', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({ ...mockDocument } as any),
      );

      const result = await service.getLink('abc12345');

      expect(result).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          targetUrl: 'https://example.com/product',
        }),
      );
    });

    it('should throw 404 when linkId index not found', async () => {
      repositoryProvider.one.mockResolvedValue(null);

      await expect(service.getLink('nonexistent')).rejects.toThrow(
        GeneralErrorException,
      );
    });

    it('should throw 404 when linkId not found in document responses', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({ ...mockDocument } as any),
      );

      await expect(service.getLink('missing99')).rejects.toThrow(
        GeneralErrorException,
      );
    });
  });

  describe('updateLink', () => {
    it('should update response fields', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      const result = await service.updateLink('abc12345', {
        title: 'Updated Title',
      });

      expect(result).toHaveProperty('message');

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      const updatedResponse = savedDoc.responses.find(
        (r: any) => r.linkId === 'abc12345',
      );
      expect(updatedResponse.title).toBe('Updated Title');
    });

    it('should increment the document version', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        title: 'Updated Title',
      });

      expect(repositoryProvider.save).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
        }),
      );
    });

    it('should record previous values in version history when targetUrl changes', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        targetUrl: 'https://example.com/updated',
      });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'updated',
          previousTargetUrl: 'https://example.com/product',
        }),
      );
    });

    it('should record previous values in version history when linkType changes', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        linkType: 'gs1:certificationInfo',
      });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'updated',
          previousLinkType: 'gs1:pip',
        }),
      );
    });

    it('should throw 404 when linkId not found', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );

      await expect(
        service.updateLink('nonexistent', { title: 'Nope' }),
      ).rejects.toThrow(GeneralErrorException);
    });

    it('should throw BAD_REQUEST when update body has no fields', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );

      await expect(service.updateLink('abc12345', {})).rejects.toThrow(
        GeneralErrorException,
      );
    });

    it('should throw ConflictException when update would duplicate another response', async () => {
      const docWithTwoLinks = {
        ...mockDocument,
        responses: [
          {
            ...mockDocument.responses[0],
            linkId: 'abc12345',
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
          },
          {
            ...mockDocument.responses[0],
            linkId: 'def67890',
            targetUrl: 'https://example.com/cert',
            linkType: 'gs1:certificationInfo',
            mimeType: 'application/json',
            ianaLanguage: 'en',
            context: 'us',
          },
        ],
      };

      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(docWithTwoLinks)) as any),
      );

      // Updating abc12345's targetUrl + linkType + mimeType to match def67890
      await expect(
        service.updateLink('abc12345', {
          targetUrl: 'https://example.com/cert',
          linkType: 'gs1:certificationInfo',
          mimeType: 'application/json',
        }),
      ).rejects.toThrow('conflict');
    });

    it('should throw ConflictException when update would duplicate a historical version', async () => {
      const docWithHistory = {
        ...mockDocument,
        responses: [
          {
            ...mockDocument.responses[0],
            linkId: 'abc12345',
            targetUrl: 'https://example.com/product-v2',
          },
          {
            ...mockDocument.responses[0],
            linkId: 'def67890',
            targetUrl: 'https://example.com/cert',
            linkType: 'gs1:certificationInfo',
            mimeType: 'application/json',
          },
        ],
        versionHistory: [
          {
            version: 2,
            updatedAt: '2024-06-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'def67890',
                action: 'updated',
                previousTargetUrl: 'https://example.com/old-cert',
              },
            ],
          },
        ],
      };

      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(docWithHistory)) as any),
      );

      // Updating abc12345 to match def67890's PREVIOUS targetUrl + current other fields
      await expect(
        service.updateLink('abc12345', {
          targetUrl: 'https://example.com/old-cert',
          linkType: 'gs1:certificationInfo',
          mimeType: 'application/json',
        }),
      ).rejects.toThrow('conflict');
    });

    it('should record previousMimeType in version history when mimeType changes', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        mimeType: 'application/json',
      });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'updated',
          previousMimeType: 'text/html',
        }),
      );
    });

    it('should record previousIanaLanguage in version history when ianaLanguage changes', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        ianaLanguage: 'fr',
      });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'updated',
          previousIanaLanguage: 'en',
        }),
      );
    });

    it('should record previousContext in version history when context changes', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', {
        context: 'au',
      });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'updated',
          previousContext: 'us',
        }),
      );
    });

    it('should not include linkHeaderText in saved document after update', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(JSON.parse(JSON.stringify(mockDocument)) as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.updateLink('abc12345', { title: 'Updated Title' });

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc).not.toHaveProperty('linkHeaderText');
    });

    it('should throw ConflictException when update would revert to link own previous composite key', async () => {
      const docWithOwnHistory = {
        ...mockDocument,
        responses: [
          {
            ...mockDocument.responses[0],
            linkId: 'abc12345',
            targetUrl: 'https://example.com/product-v2',
          },
        ],
        versionHistory: [
          {
            version: 2,
            updatedAt: '2024-06-01T00:00:00.000Z',
            changes: [
              {
                linkId: 'abc12345',
                action: 'updated',
                previousTargetUrl: 'https://example.com/product-v1',
              },
            ],
          },
        ],
      };

      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve(
              JSON.parse(JSON.stringify(docWithOwnHistory)) as any,
            ),
      );

      // Reverting abc12345 back to its own previous targetUrl should conflict
      await expect(
        service.updateLink('abc12345', {
          targetUrl: 'https://example.com/product-v1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDeleteLink', () => {
    it('should set the response active flag to false', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.softDeleteLink('abc12345');

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      const deletedResponse = savedDoc.responses.find(
        (r: any) => r.linkId === 'abc12345',
      );
      expect(deletedResponse.active).toBe(false);
    });

    it('should increment the document version', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.softDeleteLink('abc12345');

      expect(repositoryProvider.save).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
        }),
      );
    });

    it('should record version history with action soft_deleted', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.softDeleteLink('abc12345');

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'soft_deleted',
        }),
      );
    });

    it('should not call deleteLinkIndex', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.softDeleteLink('abc12345');

      expect(repositoryProvider.delete).not.toHaveBeenCalled();
    });

    it('should throw 404 when linkId not found', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );

      await expect(service.softDeleteLink('nonexistent')).rejects.toThrow(
        GeneralErrorException,
      );
    });
  });

  describe('hardDeleteLink', () => {
    it('should remove the response from the document', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);
      repositoryProvider.delete.mockResolvedValue(undefined);

      await service.hardDeleteLink('abc12345');

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      const removedResponse = savedDoc.responses.find(
        (r: any) => r.linkId === 'abc12345',
      );
      expect(removedResponse).toBeUndefined();
    });

    it('should increment the document version', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);
      repositoryProvider.delete.mockResolvedValue(undefined);

      await service.hardDeleteLink('abc12345');

      expect(repositoryProvider.save).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
        }),
      );
    });

    it('should record version history with action hard_deleted', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);
      repositoryProvider.delete.mockResolvedValue(undefined);

      await service.hardDeleteLink('abc12345');

      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.versionHistory[0].changes[0]).toEqual(
        expect.objectContaining({
          linkId: 'abc12345',
          action: 'hard_deleted',
        }),
      );
    });

    it('should call deleteLinkIndex', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);
      repositoryProvider.delete.mockResolvedValue(undefined);

      await service.hardDeleteLink('abc12345');

      expect(repositoryProvider.delete).toHaveBeenCalledWith(
        '_index/links/abc12345',
      );
    });

    it('should throw 404 when linkId not found', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );

      await expect(service.hardDeleteLink('nonexistent')).rejects.toThrow(
        GeneralErrorException,
      );
    });

    it('should succeed even when link index deletion fails', async () => {
      repositoryProvider.one.mockImplementation((id: string) =>
        id.includes('_index')
          ? Promise.resolve(mockIndex as any)
          : Promise.resolve({
              ...mockDocument,
              responses: mockDocument.responses.map((r) => ({ ...r })),
            } as any),
      );
      repositoryProvider.save.mockResolvedValue(undefined);
      repositoryProvider.delete.mockRejectedValue(
        new Error('Index delete failed'),
      );

      const result = await service.hardDeleteLink('abc12345');

      expect(result).toHaveProperty('message');
      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      const removedResponse = savedDoc.responses.find(
        (r: any) => r.linkId === 'abc12345',
      );
      expect(removedResponse).toBeUndefined();
    });
  });

  describe('resolveIdentifierConfig validation', () => {
    it('should throw INTERNAL_SERVER_ERROR when RESOLVER_DOMAIN is not configured', async () => {
      jest.spyOn(service['configService'], 'get').mockReturnValue(undefined);
      repositoryProvider.one.mockResolvedValue({ ...mockDocument });

      await expect(
        service.listLinks({
          namespace: 'gs1',
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        }),
      ).rejects.toThrow(GeneralErrorException);
    });

    it('should throw NOT_FOUND when namespace does not exist', async () => {
      const identifierService = service['identifierManagementService'];
      jest.spyOn(identifierService, 'getIdentifier').mockResolvedValue(null);

      await expect(
        service.listLinks({
          namespace: 'nonexistent',
          identificationKeyType: 'gtin',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        }),
      ).rejects.toThrow(GeneralErrorException);
    });

    it('should throw BAD_REQUEST when identification key type cannot be resolved', async () => {
      repositoryProvider.one.mockResolvedValue({ ...mockDocument });

      await expect(
        service.listLinks({
          namespace: 'gs1',
          identificationKeyType: 'unknown_type',
          identificationKey: '09359502000010',
          qualifierPath: '/',
        }),
      ).rejects.toThrow(GeneralErrorException);
    });
  });

  describe('fetchDocument normalisation', () => {
    it('should normalise and persist a legacy document missing version and linkId', async () => {
      const legacyDoc = {
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        itemDescription: 'Test Product',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Information',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
        linkset: {},
        linkHeaderText: '',
      };

      repositoryProvider.one.mockResolvedValue(legacyDoc as any);
      repositoryProvider.save.mockResolvedValue(undefined);

      await service.listLinks({
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      });

      // Document should have been normalised and persisted
      expect(repositoryProvider.save).toHaveBeenCalled();
      const savedDoc = repositoryProvider.save.mock.calls[0][0];
      expect(savedDoc.version).toBeDefined();
      // Each response should now have a linkId
      expect(savedDoc.responses[0].linkId).toBeDefined();
    });

    it('should not persist when document already has version and linkIds', async () => {
      repositoryProvider.one.mockResolvedValue({ ...mockDocument });

      await service.listLinks({
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      });

      // Document already normalised — no save call needed
      expect(repositoryProvider.save).not.toHaveBeenCalled();
    });

    it('should continue serving the read even if persistence of normalised document fails', async () => {
      const legacyDoc = {
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        itemDescription: 'Test Product',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            targetUrl: 'https://example.com/product',
            linkType: 'gs1:pip',
            title: 'Product Information',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            active: true,
            fwqs: false,
            defaultLinkType: true,
            defaultIanaLanguage: true,
            defaultContext: true,
            defaultMimeType: true,
          },
        ],
        linkset: {},
        linkHeaderText: '',
      };

      repositoryProvider.one.mockResolvedValue(legacyDoc as any);
      repositoryProvider.save.mockRejectedValue(
        new Error('Storage write failed'),
      );

      // Should still return results despite persistence failure
      const result = await service.listLinks({
        namespace: 'gs1',
        identificationKeyType: 'gtin',
        identificationKey: '09359502000010',
        qualifierPath: '/',
      });

      expect(result).toHaveLength(1);
      expect(result[0].targetUrl).toBe('https://example.com/product');
    });
  });

  describe('default flag recalculation', () => {
    const twoResponseDoc = {
      ...mockDocument,
      responses: [
        {
          linkId: 'abc12345',
          targetUrl: 'https://example.com/product',
          linkType: 'gs1:pip',
          title: 'Product Information',
          mimeType: 'text/html',
          ianaLanguage: 'en',
          context: 'us',
          active: true,
          fwqs: false,
          defaultLinkType: true,
          defaultIanaLanguage: true,
          defaultContext: true,
          defaultMimeType: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          linkId: 'def67890',
          targetUrl: 'https://example.com/cert',
          linkType: 'gs1:pip',
          title: 'Certification Info',
          mimeType: 'text/html',
          ianaLanguage: 'en',
          context: 'us',
          active: true,
          fwqs: false,
          defaultLinkType: false,
          defaultIanaLanguage: false,
          defaultContext: false,
          defaultMimeType: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };

    describe('updateLink', () => {
      it('should unset other defaults when setting defaultLinkType to true', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve(
                JSON.parse(JSON.stringify(twoResponseDoc)) as any,
              ),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.updateLink('def67890', { defaultLinkType: true });

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );

        expect(link1.defaultLinkType).toBe(false);
        expect(link2.defaultLinkType).toBe(true);
      });

      it('should unset other defaults when setting defaultIanaLanguage to true in same scope', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve(
                JSON.parse(JSON.stringify(twoResponseDoc)) as any,
              ),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.updateLink('def67890', { defaultIanaLanguage: true });

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );

        // Both are same linkType, so last one (def67890) wins
        expect(link1.defaultIanaLanguage).toBe(false);
        expect(link2.defaultIanaLanguage).toBe(true);
      });

      it('should recalculate both scopes when linkType changes', async () => {
        const twoLinkTypeDoc = {
          ...mockDocument,
          versionHistory: [],
          responses: [
            {
              linkId: 'abc12345',
              targetUrl: 'https://example.com/product',
              linkType: 'gs1:pip',
              title: 'Product Information',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'us',
              active: true,
              fwqs: false,
              defaultLinkType: true,
              defaultIanaLanguage: true,
              defaultContext: true,
              defaultMimeType: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
            {
              linkId: 'def67890',
              targetUrl: 'https://example.com/cert',
              linkType: 'gs1:certificationInfo',
              title: 'Certification Info',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'us',
              active: true,
              fwqs: false,
              defaultLinkType: false,
              defaultIanaLanguage: true,
              defaultContext: true,
              defaultMimeType: true,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        };

        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve(
                JSON.parse(JSON.stringify(twoLinkTypeDoc)) as any,
              ),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        // Move def67890 into the same linkType as abc12345
        await service.updateLink('def67890', { linkType: 'gs1:pip' });

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );

        // Both now in same linkType scope — only one should have defaultIanaLanguage
        const defaultIanaCount = [link1, link2].filter(
          (l: any) => l.defaultIanaLanguage,
        ).length;
        expect(defaultIanaCount).toBe(1);
      });

      it('should recalculate defaults when reactivating a soft-deleted link', async () => {
        const docWithInactive = {
          ...mockDocument,
          versionHistory: [],
          responses: [
            {
              linkId: 'abc12345',
              targetUrl: 'https://example.com/product',
              linkType: 'gs1:pip',
              title: 'Product Information',
              mimeType: 'text/html',
              ianaLanguage: 'en',
              context: 'us',
              active: false,
              fwqs: false,
              defaultLinkType: false,
              defaultIanaLanguage: false,
              defaultContext: false,
              defaultMimeType: false,
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            },
          ],
        };

        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve(
                JSON.parse(JSON.stringify(docWithInactive)) as any,
              ),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.updateLink('abc12345', { active: true });

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );

        // Reactivated link should be promoted as the only active response
        expect(link.active).toBe(true);
        expect(link.defaultLinkType).toBe(true);
        expect(link.defaultIanaLanguage).toBe(true);
        expect(link.defaultContext).toBe(true);
        expect(link.defaultMimeType).toBe(true);
      });

      it('should not affect defaults when updating a non-default field', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve(
                JSON.parse(JSON.stringify(twoResponseDoc)) as any,
              ),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.updateLink('abc12345', { title: 'New Title' });

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );

        // link1 should keep all its defaults
        expect(link1.defaultLinkType).toBe(true);
        expect(link1.defaultIanaLanguage).toBe(true);
        expect(link1.defaultContext).toBe(true);
        expect(link1.defaultMimeType).toBe(true);

        // link2 should remain without defaults
        expect(link2.defaultLinkType).toBe(false);
        expect(link2.defaultIanaLanguage).toBe(false);
        expect(link2.defaultContext).toBe(false);
        expect(link2.defaultMimeType).toBe(false);
      });
    });

    describe('softDeleteLink', () => {
      it('should promote another active link as default when the default link is soft-deleted', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve({
                ...twoResponseDoc,
                responses: twoResponseDoc.responses.map((r) => ({ ...r })),
              } as any),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.softDeleteLink('abc12345');

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );

        // Soft-deleted link loses all defaults
        expect(link1.active).toBe(false);
        expect(link1.defaultLinkType).toBe(false);
        expect(link1.defaultIanaLanguage).toBe(false);
        expect(link1.defaultContext).toBe(false);
        expect(link1.defaultMimeType).toBe(false);

        // Remaining active link gets promoted
        expect(link2.defaultLinkType).toBe(true);
        expect(link2.defaultIanaLanguage).toBe(true);
        expect(link2.defaultContext).toBe(true);
        expect(link2.defaultMimeType).toBe(true);
      });

      it('should not promote when there are no other active links in the scope', async () => {
        const singleResponseDoc = {
          ...mockDocument,
          responses: [
            {
              ...mockDocument.responses[0],
            },
          ],
        };

        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve({
                ...singleResponseDoc,
                responses: singleResponseDoc.responses.map((r) => ({ ...r })),
              } as any),
        );
        repositoryProvider.save.mockResolvedValue(undefined);

        await service.softDeleteLink('abc12345');

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        const link1 = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );

        // Only link is now inactive, no promotion possible
        expect(link1.active).toBe(false);
        expect(link1.defaultLinkType).toBe(false);
      });
    });

    describe('hardDeleteLink', () => {
      it('should promote another active link as default when the default link is hard-deleted', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve({
                ...twoResponseDoc,
                responses: twoResponseDoc.responses.map((r) => ({ ...r })),
              } as any),
        );
        repositoryProvider.save.mockResolvedValue(undefined);
        repositoryProvider.delete.mockResolvedValue(undefined);

        await service.hardDeleteLink('abc12345');

        const savedDoc = repositoryProvider.save.mock.calls[0][0];

        // abc12345 should be removed entirely
        const removedResponse = savedDoc.responses.find(
          (r: any) => r.linkId === 'abc12345',
        );
        expect(removedResponse).toBeUndefined();

        // Remaining link should be promoted to default
        const link2 = savedDoc.responses.find(
          (r: any) => r.linkId === 'def67890',
        );
        expect(link2.defaultLinkType).toBe(true);
        expect(link2.defaultIanaLanguage).toBe(true);
        expect(link2.defaultContext).toBe(true);
        expect(link2.defaultMimeType).toBe(true);
      });

      it('should handle hard-deleting when only one response exists', async () => {
        repositoryProvider.one.mockImplementation((id: string) =>
          id.includes('_index')
            ? Promise.resolve(mockIndex as any)
            : Promise.resolve({
                ...mockDocument,
                responses: mockDocument.responses.map((r) => ({ ...r })),
              } as any),
        );
        repositoryProvider.save.mockResolvedValue(undefined);
        repositoryProvider.delete.mockResolvedValue(undefined);

        await service.hardDeleteLink('abc12345');

        const savedDoc = repositoryProvider.save.mock.calls[0][0];
        expect(savedDoc.responses).toHaveLength(0);
      });
    });
  });
});
