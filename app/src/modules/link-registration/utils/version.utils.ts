import { v4 as uuidv4 } from 'uuid';
import {
  LinkChange,
  VersionHistoryEntry,
} from '../interfaces/versioned-uri.interface';

/**
 * Generates a unique link ID (UUID v4).
 */
export function generateLinkId(): string {
  return uuidv4();
}

/**
 * Creates a new version history entry.
 */
export function createVersionHistoryEntry(
  version: number,
  changes: LinkChange[],
  timestamp?: string,
): VersionHistoryEntry {
  return {
    version,
    updatedAt: timestamp ?? new Date().toISOString(),
    changes,
  };
}

/**
 * Normalises a document read from storage, filling in missing version fields with safe defaults.
 * This handles backward compatibility with documents created before versioning was introduced.
 */
export function normaliseDocument<T extends Record<string, any>>(
  doc: T,
): T & {
  version: number;
  updatedAt: string;
  versionHistory: VersionHistoryEntry[];
} {
  const normalised: Record<string, any> = { ...doc };
  if (normalised.version == null) normalised.version = 1;
  if (!normalised.updatedAt)
    normalised.updatedAt = normalised.createdAt || new Date().toISOString();
  if (!normalised.versionHistory) normalised.versionHistory = [];
  if (!Array.isArray(normalised.responses)) normalised.responses = [];

  // Ensure all responses have linkIds
  if (normalised.responses.length > 0) {
    normalised.responses = normalised.responses.map((response: any) => ({
      ...response,
      linkId: response.linkId || generateLinkId(),
      createdAt:
        response.createdAt || normalised.createdAt || new Date().toISOString(),
      updatedAt:
        response.updatedAt || normalised.updatedAt || new Date().toISOString(),
    }));
  }

  return normalised as T & {
    version: number;
    updatedAt: string;
    versionHistory: VersionHistoryEntry[];
  };
}
