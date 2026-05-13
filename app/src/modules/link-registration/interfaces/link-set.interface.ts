export type LinkContextObject = {
  anchor: string;
  description: string;
  [extensionRelationType: string]: any;
};

export type LinkTargetObject = {
  href: string;
  title?: string;
  'title*'?: InternationalizedTargetAttributes[];
  type?: string;
  hreflang?: string[];
  media?: string;
  encryptionMethod?: string;
  accessRole?: string[];
  method?: string;
  rel?: string[];
  /**
   * Whether the URL itself is safe to publish in a public directory.
   * Distinct from `accessRole` and `encryptionMethod`, which govern who
   * may retrieve or decrypt the *content* at that URL. A target may be
   * `public: true` while still requiring an authorised role to fetch
   * the resource.
   *
   * @see https://untp.unece.org/docs/specification/IdentityResolver UNTP Identity Resolver Linkset Schema
   */
  public?: boolean;
};

export type InternationalizedTargetAttributes = {
  value: string;
  language: string;
};

/**
 * Minimal response shape required by linkset construction utilities.
 * Both the registration DTO's Response class and the resolution module's
 * LinkResponse interface satisfy this structurally, so the linkset utils
 * remain agnostic to which module provides the data.
 */
export interface LinkSetResponseInput {
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
  encryptionMethod?: string;
  accessRole?: string[];
  method?: string;
  /** @see {@link LinkTargetObject.public} */
  public?: boolean;
  rel?: string[];
  linkId?: string;
}

/**
 * Minimal URI shape required by linkset construction utilities.
 */
export interface LinkSetInput {
  namespace: string;
  identificationKeyType: string;
  identificationKey: string;
  qualifierPath: string;
  active: boolean;
  description: string;
  responses: LinkSetResponseInput[];
}
