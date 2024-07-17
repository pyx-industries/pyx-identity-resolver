export type LinkContextObject = {
  anchor: string;
  [extensionRelationType: string]: any;
};

export type LinkTargetObject = {
  href: string;
  title?: string;
  'title*'?: InternationalizedTargetAttributes[];
  type?: string;
  hreflang?: string;
  media?: string;
};

export type InternationalizedTargetAttributes = {
  value: string;
  language: string;
};
