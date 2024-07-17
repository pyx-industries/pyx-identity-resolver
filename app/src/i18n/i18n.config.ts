import {
  I18nOptions,
  I18nJsonLoader,
  QueryResolver,
  AcceptLanguageResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

export const i18nConfig: I18nOptions = {
  fallbackLanguage: 'en',
  loader: I18nJsonLoader,
  loaderOptions: {
    path: path.join(__dirname, '/locales/'),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    AcceptLanguageResolver,
    new HeaderResolver(['x-lang']),
  ],
};
