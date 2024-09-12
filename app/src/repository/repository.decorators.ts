import { Inject } from '@nestjs/common';
import { getRepositoryToken } from './repository.utils';

export const InjectRepository = (name: string): ReturnType<typeof Inject> =>
  Inject(getRepositoryToken(name));
