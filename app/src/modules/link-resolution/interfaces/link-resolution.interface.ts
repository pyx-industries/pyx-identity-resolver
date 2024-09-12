export type ResolvedLink = {
  targetUrl?: string;
  data?: Record<string, any>;
  mimeType: string;
  fwqs?: boolean;
  linkHeaderText: string;
};

export type IanalanguageContext = {
  ianaLanguage: string;
  context: string;
};
