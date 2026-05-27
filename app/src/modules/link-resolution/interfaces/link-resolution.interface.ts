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
  /**
   * The composed API base URL: `RESOLVER_DOMAIN` + `APP_ROUTE_PREFIX`
   * (e.g. `https://resolver.example.com/api/v4`). Downstream URL
   * builders concatenate further path segments onto this value without
   * adding the prefix again. Callers MUST compose this value once at
   * the boundary; passing the bare `RESOLVER_DOMAIN` env value would
   * silently drop the API path from every anchor.
   */
  resolverDomain: string;
  linkTypeVocDomain: string;
  namespace: string;
  identificationKey: string;
  qualifierPath: string;
  linkType?: string;
  accessRole?: string;
  linkHeaderMaxSize: number;
}
