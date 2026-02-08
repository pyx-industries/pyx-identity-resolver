export type ResolvedLink = {
  targetUrl?: string;
  data?: Record<string, any>;
  mimeType: string;
  fwqs?: boolean;
  linkHeaderText: string;
  linkHeaderTextFull: string;
};

export interface ResolutionContext {
  identificationKeyCode: string;
  resolverDomain: string;
  linkTypeVocDomain: string;
  namespace: string;
  identificationKey: string;
  qualifierPath: string;
  linkType?: string;
  accessRole?: string;
  linkHeaderMaxSize: number;
}

export type IanalanguageContext = {
  ianaLanguage: string;
  context: string;
};
