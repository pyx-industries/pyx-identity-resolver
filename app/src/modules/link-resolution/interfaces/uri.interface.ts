import { LinkContextObject } from '../../link-registration/interfaces/link-set.interface';
import { EncryptionMethod } from '../../link-registration/constants/untp-enums';

export interface LinkResponse {
  targetUrl: string;
  title: string;
  linkType: string;
  context: string;
  mimeType: string;
  active: boolean;
  fwqs: boolean;
  defaultLinkType: boolean;
  defaultContext: boolean;
  defaultMimeType: boolean;
  linkId?: string;
  createdAt?: string;
  updatedAt?: string;
  encryptionMethod?: EncryptionMethod;
  accessRole?: string[];
  method?: string;
  /** @see {@link LinkTargetObject.public} from `../../link-registration/interfaces/link-set.interface` */
  public?: boolean;
  rel?: string[];
  /** @see {@link LinkTargetObject.hreflang} from `../../link-registration/interfaces/link-set.interface` */
  hreflang?: string[];
}

export interface LinkChange {
  linkId: string;
  action: 'created' | 'updated' | 'soft_deleted' | 'hard_deleted';
  previousTargetUrl?: string;
  previousLinkType?: string;
  previousMimeType?: string;
  previousContext?: string;
  previousHreflang?: string[];
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
  description: string;
  qualifierPath: string;
  active: boolean;
  responses: LinkResponse[];
  linkset?: LinkContextObject;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  versionHistory?: VersionHistoryEntry[];
}
