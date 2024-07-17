import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierManagementService } from './identifier-management.service';

import { IdentifierDto } from './dto/identifier.dto';
import { I18nService } from 'nestjs-i18n';
import { IRepositoryProvider } from '../../repository/providers/provider.repository.interface';
import { ConfigService } from '@nestjs/config';

const IDENTIFIER_PATH = 'test';

describe('IdentifierManagementService', () => {
  let service: IdentifierManagementService;
  let repositoryProvider: IRepositoryProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentifierManagementService,
        {
          provide: I18nService,
          useValue: {
            translate: jest
              .fn()
              .mockImplementation(
                (key, args) => `${key}-${JSON.stringify(args)}`,
              ),
          },
        },
        {
          provide: 'RepositoryProvider',
          useValue: {
            save: jest.fn(),
            one: jest.fn(),
            delete: jest.fn(),
            all: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(() => IDENTIFIER_PATH),
          },
        },
      ],
    }).compile();

    service = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
    repositoryProvider = module.get<IRepositoryProvider>('RepositoryProvider');
  });

  describe('upsertIdentifier', () => {
    it('should upsert identifier successfully if no errors are found', async () => {
      const identifierDto: IdentifierDto = {
        namespace: 'test',
        applicationIdentifiers: [
          {
            title: 'a',
            label: 'aa',
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            qualifiers: ['Q1'],
            regex: '^\\d+$',
          },
          {
            title: 'b',
            label: 'bb',
            ai: 'Q1',
            shortcode: 'Q1',
            type: 'Q',
            regex: '^test\\d+$',
          },
        ],
      };

      await expect(
        service.upsertIdentifier(identifierDto),
      ).resolves.not.toThrow();

      expect(repositoryProvider.save).toHaveBeenCalledWith({
        id: `${IDENTIFIER_PATH}/test`,
        namespace: 'test',
        applicationIdentifiers: [
          {
            title: 'a',
            label: 'aa',
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            qualifiers: ['Q1'],
            regex: '^\\d+$',
          },
          {
            title: 'b',
            label: 'bb',
            ai: 'Q1',
            shortcode: 'Q1',
            type: 'Q',
            regex: '^test\\d+$',
          },
        ],
      });
    });
  });

  describe('getIdentifier', () => {
    it('should retrieve an identifier by namespace', async () => {
      const namespace = 'test-namespace';

      jest.spyOn(repositoryProvider, 'one').mockResolvedValueOnce({
        namespace: 'test-namespace',
      });

      const identifier = await service.getIdentifier(namespace);

      expect(identifier).toEqual({ namespace });

      expect(repositoryProvider.one).toHaveBeenCalledWith(
        `${IDENTIFIER_PATH}/${namespace}`,
      );
    });

    it('should throw an error if the identifier cannot be found', async () => {
      const namespace = 'non-existent-namespace';
      jest.spyOn(repositoryProvider, 'one').mockRejectedValueOnce(new Error());

      await expect(service.getIdentifier(namespace)).rejects.toThrow();
    });
  });

  describe('getIdentifiers', () => {
    it('should retrieve a list of all identifiers', async () => {
      const namespace = 'test-namespace';

      jest.spyOn(repositoryProvider, 'all').mockResolvedValueOnce([namespace]);

      const identifiers = await service.getIdentifiers();

      expect(identifiers).toEqual([namespace]);

      expect(repositoryProvider.all).toHaveBeenCalledWith(
        `${IDENTIFIER_PATH}/`,
      );
    });

    it('should throw an error if the identifierPath cannot be found', async () => {
      jest.spyOn(repositoryProvider, 'all').mockRejectedValueOnce(new Error());

      await expect(service.getIdentifiers()).rejects.toThrow();
    });
  });

  describe('saveIdentifier', () => {
    it('should save an identifier', async () => {
      const namespace = 'test-namespace';
      const identifierDto: IdentifierDto = {
        namespace,
        applicationIdentifiers: [
          {
            title: 'a',
            label: 'aa',
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            regex: '^\\d+$',
          },
        ],
      };

      jest.spyOn(repositoryProvider, 'save').mockResolvedValueOnce();

      await expect(
        service['saveIdentifier'](namespace, identifierDto),
      ).resolves.not.toThrow();

      expect(repositoryProvider.save).toHaveBeenCalledWith({
        id: `${IDENTIFIER_PATH}/test-namespace`,
        namespace,
        applicationIdentifiers: [
          {
            title: 'a',
            label: 'aa',
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            regex: '^\\d+$',
          },
        ],
      });
    });

    it('should throw an error if the save operation fails', async () => {
      const namespace = 'error-namespace';
      const identifierDto: IdentifierDto = {
        namespace,
        applicationIdentifiers: [
          {
            title: 'a',
            label: 'aa',
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            regex: '^\\d+$',
          },
        ],
      };
      jest.spyOn(repositoryProvider, 'save').mockRejectedValueOnce(new Error());
      await expect(
        service['saveIdentifier'](namespace, identifierDto),
      ).rejects.toThrow();
    });
  });

  describe('deleteIdentifier', () => {
    it('should delete an identifier', async () => {
      const namespace = 'test-namespace';

      jest.spyOn(repositoryProvider, 'delete').mockResolvedValueOnce();

      await expect(service.deleteIdentifier(namespace)).resolves.not.toThrow();

      expect(repositoryProvider.delete).toHaveBeenCalledWith(
        `${IDENTIFIER_PATH}/${namespace}`,
      );
    });

    it('should throw an error if the delete operation fails', async () => {
      const namespace = 'error-namespace';
      jest
        .spyOn(repositoryProvider, 'delete')
        .mockRejectedValueOnce(new Error());

      await expect(service.deleteIdentifier(namespace)).rejects.toThrow();
    });
  });
});
