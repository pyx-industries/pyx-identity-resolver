import { LinkContextObject } from '../../link-registration/interfaces/link-set.interface';

export interface LinkResponse {
  targetUrl: string;
  title: string;
  linkType: string;
  ianaLanguage: string;
  context: string;
  mimeType: string;
  active: boolean;
  fwqs: boolean;
  defaultLinkType: boolean;
  defaultIanaLanguage: boolean;
  defaultContext: boolean;
  defaultMimeType: boolean;
  linkId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LinkChange {
  linkId: string;
  action: 'created' | 'updated' | 'soft_deleted' | 'hard_deleted';
  previousTargetUrl?: string;
  previousLinkType?: string;
  previousMimeType?: string;
  previousIanaLanguage?: string;
  previousContext?: string;
}

export interface VersionHistoryEntry {
  version: number;
  updatedAt: string;
  changes: LinkChange[];
}

export interface Uri {
  id: string;
  namespace: string;
  identificationKeyType: string;
  identificationKey: string;
  itemDescription: string;
  qualifierPath: string;
  active: boolean;
  responses: LinkResponse[];
  linkset?: LinkContextObject;
  linkHeaderText?: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  versionHistory?: VersionHistoryEntry[];
}
