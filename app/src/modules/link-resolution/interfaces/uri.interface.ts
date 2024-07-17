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
}
