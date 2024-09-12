import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierExistencePipe } from './identifier-existence.pipe';
import { I18nService } from 'nestjs-i18n';
import { GeneralErrorException } from '../../../common/exceptions/general-error.exception';
import { IdentifierManagementService } from '../identifier-management.service';

// Mock implementation of the I18nService
const mockI18nService = {
  translate: jest.fn().mockResolvedValue('translated message'),
};

describe('IdentifierExistencePipe', () => {
  let pipe: IdentifierExistencePipe;
  let mockIdentifierManagementService: IdentifierManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentifierExistencePipe,
        { provide: I18nService, useValue: mockI18nService },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn().mockResolvedValue({
              namespace: 'testNamespace',
              applicationIdentifiers: [],
            }),
          },
        },
      ],
    }).compile();

    pipe = module.get<IdentifierExistencePipe>(IdentifierExistencePipe);
    mockIdentifierManagementService = module.get(IdentifierManagementService);
  });

  it('should return the namespace when identifier exists', async () => {
    const namespace = 'testNamespace';
    const result = await pipe.transform(namespace);

    expect(result).toBe(namespace);
  });

  it('should throw GeneralErrorException when identifier does not exist', async () => {
    const namespace = 'nonExistingNamespace';
    jest
      .spyOn(mockIdentifierManagementService, 'getIdentifier')
      .mockResolvedValue(null);

    await expect(pipe.transform(namespace)).rejects.toThrow(
      GeneralErrorException,
    );

    expect(mockI18nService.translate).toHaveBeenCalledWith(
      'errors.identifier_file_not_found',
      expect.objectContaining({ args: { namespace } }),
    );
  });

  it('should return namespace if namespace is not provided', async () => {
    const namespace = undefined;

    const result = await pipe.transform(namespace);

    expect(result).toBe(namespace);
  });
});
