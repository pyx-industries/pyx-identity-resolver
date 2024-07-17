import { TestingModule, Test } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { IdentifierManagementService } from '../identifier-management.service';
import { IdentifierSetValidationPipe } from './identifier-set-validation.pipe';
import { CreateLinkRegistrationDto } from '../../link-registration/dto/link-registration.dto';
import { LinkResolutionDto } from '../../link-resolution/dto/link-resolution.dto';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';

describe('IdentifierSetValidationPipe', () => {
  let pipe: IdentifierSetValidationPipe;
  const mockIdentifierManagementService: jest.Mocked<IdentifierManagementService> =
    {
      getIdentifier: jest.fn().mockResolvedValue({
        namespace: 'testNamespace',
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'test',
            regex: '^.*$',
            type: 'I',
            qualifiers: ['10'],
          },
          {
            ai: '10',
            regex: '^.*$',
            type: 'Q',
          },
        ],
      }),
    } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentifierSetValidationPipe,
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn().mockReturnValue('translated message'),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: mockIdentifierManagementService,
        },
      ],
    }).compile();

    pipe = module.get<IdentifierSetValidationPipe>(IdentifierSetValidationPipe);
  });

  describe('transform', () => {
    it('should return the input when the input data from link registration', async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'testNamespace',
        identificationKey: 'testKey',
        identificationKeyType: 'test',
        qualifierPath: '/10/123456',
        responses: [],
        itemDescription: '',
        active: false,
      };

      const result = await pipe.transform(payload);

      expect(result).toBe(payload);
    });

    it('should return the input when the input data from link resolution', async () => {
      const payload: LinkResolutionDto = {
        namespace: 'testNamespace',
        identifiers: {
          primary: {
            qualifier: 'test',
            id: 'testKey',
          },

          secondaries: [
            {
              qualifier: '10',
              id: '123456',
            },
          ],
        },
      };
      const result = await pipe.transform(payload);

      expect(result).toBe(payload);
    });

    it('should throw an error when the namespace is invalid', async () => {
      jest
        .spyOn(mockIdentifierManagementService, 'getIdentifier')
        .mockResolvedValueOnce(undefined);

      const payload: LinkResolutionDto = {
        namespace: 'invalid',
        identifiers: {
          primary: {
            qualifier: 'test',
            id: 'testKey',
          },

          secondaries: [
            {
              qualifier: '10',
              id: '123456',
            },
          ],
        },
      };
      expect(pipe.transform(payload)).rejects.toThrow(FieldErrorsException);
    });

    it('should throw an error when the input data is invalid', async () => {
      const payload: LinkResolutionDto = {
        namespace: 'testNamespace',
        identifiers: {
          primary: {
            qualifier: 'invalid',
            id: 'testKey',
          },

          secondaries: [
            {
              qualifier: '10',
              id: '123456',
            },
          ],
        },
      };
      expect(pipe.transform(payload)).rejects.toThrow(FieldErrorsException);
    });
  });
});
