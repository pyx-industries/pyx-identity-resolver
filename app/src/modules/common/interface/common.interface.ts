export type SupportedLinkType = {
  namespace: string;
  prefix: string;
  profile: string;
};

export interface ResolverConfig {
  name: string;
  resolverRoot: string;
  supportedLinkType: Array<SupportedLinkType>;
  supportedPrimaryKeys: Array<string>;
}
