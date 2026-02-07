import {
  Uri,
  VersionHistoryEntry,
  LinkChange,
} from '../../link-resolution/interfaces/uri.interface';

/**
 * A Uri document with version fields guaranteed to be present.
 * Used internally after normalisation of legacy documents.
 */
export interface VersionedUri
  extends Omit<Uri, 'version' | 'updatedAt' | 'versionHistory'> {
  version: number;
  updatedAt: string;
  versionHistory: VersionHistoryEntry[];
}

export { VersionHistoryEntry, LinkChange };
