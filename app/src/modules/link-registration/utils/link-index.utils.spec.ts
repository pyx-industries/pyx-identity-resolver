import {
  getLinkIndexPath,
  writeLinkIndex,
  readLinkIndex,
  deleteLinkIndex,
} from './link-index.utils';
import { IRepositoryProvider } from '../../../repository/providers/provider.repository.interface';

describe('Link Index Utils', () => {
  const mockRepositoryProvider: jest.Mocked<IRepositoryProvider> = {
    save: jest.fn(),
    one: jest.fn(),
    all: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLinkIndexPath', () => {
    it('should return the correct path format _index/links/{linkId}', () => {
      const result = getLinkIndexPath('abc12345');

      expect(result).toBe('_index/links/abc12345');
    });
  });

  describe('writeLinkIndex', () => {
    it('should call repositoryProvider.save with correct id and documentPath', async () => {
      const linkId = 'link001';
      const documentPath = 'ns/01/12345.json';

      await writeLinkIndex(mockRepositoryProvider, linkId, documentPath);

      expect(mockRepositoryProvider.save).toHaveBeenCalledTimes(1);
      expect(mockRepositoryProvider.save).toHaveBeenCalledWith({
        id: '_index/links/link001',
        documentPath: 'ns/01/12345.json',
      });
    });

    it('should use getLinkIndexPath for the id', async () => {
      const linkId = 'custom-id';
      const expectedPath = getLinkIndexPath(linkId);

      await writeLinkIndex(mockRepositoryProvider, linkId, 'some/path.json');

      const callArgs = mockRepositoryProvider.save.mock.calls[0][0];
      expect(callArgs.id).toBe(expectedPath);
    });
  });

  describe('readLinkIndex', () => {
    it('should return documentPath when the index entry exists', async () => {
      const linkId = 'link001';
      mockRepositoryProvider.one.mockResolvedValue({
        documentPath: 'ns/01/12345.json',
      });

      const result = await readLinkIndex(mockRepositoryProvider, linkId);

      expect(result).toBe('ns/01/12345.json');
      expect(mockRepositoryProvider.one).toHaveBeenCalledWith(
        '_index/links/link001',
      );
    });

    it('should return undefined when the index entry does not exist', async () => {
      const linkId = 'nonexistent';
      mockRepositoryProvider.one.mockResolvedValue(undefined);

      const result = await readLinkIndex(mockRepositoryProvider, linkId);

      expect(result).toBeUndefined();
      expect(mockRepositoryProvider.one).toHaveBeenCalledWith(
        '_index/links/nonexistent',
      );
    });
  });

  describe('deleteLinkIndex', () => {
    it('should call repositoryProvider.delete with the correct path', async () => {
      const linkId = 'link001';

      await deleteLinkIndex(mockRepositoryProvider, linkId);

      expect(mockRepositoryProvider.delete).toHaveBeenCalledTimes(1);
      expect(mockRepositoryProvider.delete).toHaveBeenCalledWith(
        '_index/links/link001',
      );
    });
  });
});
