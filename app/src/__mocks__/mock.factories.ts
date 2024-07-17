import { I18nService } from 'nestjs-i18n';
import { IRepositoryProvider } from '../repository/providers/provider.repository.interface';
import { MockType } from './mock.interface';

export const repositoryProviderMockFactory: () => MockType<IRepositoryProvider> =
  jest.fn(() => ({
    save: jest.fn(),
    one: jest.fn(),
    all: jest.fn(),
    delete: jest.fn(),
  }));

export const i18nServiceMockFactory: () => MockType<I18nService> = jest.fn(
  () => ({
    translate: jest.fn(),
  }),
);
