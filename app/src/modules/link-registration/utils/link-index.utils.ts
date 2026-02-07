import { IRepositoryProvider } from '../../../repository/providers/provider.repository.interface';

const INDEX_PREFIX = '_index/links';

/**
 * Constructs the index path for a given linkId.
 */
export function getLinkIndexPath(linkId: string): string {
  return `${INDEX_PREFIX}/${linkId}`;
}

/**
 * Writes a linkId index entry mapping a linkId to its parent document path.
 */
export async function writeLinkIndex(
  repositoryProvider: IRepositoryProvider,
  linkId: string,
  documentPath: string,
): Promise<void> {
  await repositoryProvider.save({
    id: getLinkIndexPath(linkId),
    documentPath,
  });
}

/**
 * Reads a linkId index entry and returns the parent document path.
 * Returns undefined if the index entry does not exist.
 */
export async function readLinkIndex(
  repositoryProvider: IRepositoryProvider,
  linkId: string,
): Promise<string | undefined> {
  const index = await repositoryProvider.one<{ documentPath: string }>(
    getLinkIndexPath(linkId),
  );
  return index?.documentPath;
}

/**
 * Deletes a linkId index entry.
 */
export async function deleteLinkIndex(
  repositoryProvider: IRepositoryProvider,
  linkId: string,
): Promise<void> {
  await repositoryProvider.delete(getLinkIndexPath(linkId));
}
