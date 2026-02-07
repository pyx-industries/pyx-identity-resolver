import { EncryptionMethod, UntpAccessRole } from '../constants/untp-enums';

export type LinkContextObject = {
  anchor: string;
  [extensionRelationType: string]: any;
};

export type LinkTargetObject = {
  href: string;
  title?: string;
  'title*'?: InternationalizedTargetAttributes[];
  type?: string;
  hreflang?: string[];
  media?: string;
  encryptionMethod?: EncryptionMethod;
  accessRole?: UntpAccessRole[];
  method?: string;
  rel?: string[];
};

export type InternationalizedTargetAttributes = {
  value: string;
  language: string;
};
