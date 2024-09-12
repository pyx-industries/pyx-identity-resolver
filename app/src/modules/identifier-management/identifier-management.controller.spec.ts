import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierManagementController } from './identifier-management.controller';
import { IdentifierManagementService } from './identifier-management.service';
import { IdentifierDto } from './dto/identifier.dto';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { FieldErrorsException } from '../../common/exceptions/field-errors.exception';
import { I18nModule, I18nService } from 'nestjs-i18n';
import { i18nConfig } from '../../i18n/i18n.config';
import { ConfigService } from '@nestjs/config';
import { IdentifierSetValidationPipe } from './pipes/identifier-set-validation.pipe';

const IDENTIFIER_PATH = 'test';

describe('IdentifierManagementController', () => {
  let app: INestApplication;
  let controller: IdentifierManagementController;
  let service: IdentifierManagementService;
  let i18nService: I18nService;

  const mockIdentifierManagementService = {
    upsertIdentifier: jest.fn(),
    getIdentifier: jest.fn(),
    getIdentifiers: jest.fn(),
    deleteIdentifier: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [I18nModule.forRoot(i18nConfig)],
      controllers: [IdentifierManagementController],
      providers: [
        {
          provide: 'RepositoryProvider',
          useValue: {
            one: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(() => IDENTIFIER_PATH),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: mockIdentifierManagementService,
        },
      ],
    })
      .overridePipe(IdentifierSetValidationPipe)
      .useValue(jest.fn())
      .compile();

    app = module.createNestApplication();

    controller = module.get<IdentifierManagementController>(
      IdentifierManagementController,
    );
    service = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );

    i18nService = module.get<I18nService>(I18nService);
  });

  afterAll(async () => {
    app.close();
  });

  describe('upsertIdentifier', () => {
    it('should call service.upsertIdentifier and return undefined on success', async () => {
      const identifierDto: IdentifierDto = {
        namespace: 'test-namespace',
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            title: 'Title1',
            label: 'Label1',
            regex: '^\\d+$',
          },
        ],
      };

      mockIdentifierManagementService.upsertIdentifier.mockResolvedValue(
        undefined,
      );

      const result = await controller.upsertIdentifier(identifierDto);

      expect(service.upsertIdentifier).toHaveBeenCalledWith(identifierDto);
      expect(result).toEqual({
        message: 'Application identifier upserted successfully',
      });
    });

    it('should handle service errors', async () => {
      const identifierDto: IdentifierDto = {
        namespace: 'test-namespace',
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'A1',
            type: 'S',
            title: 'Title1',
            label: 'Label1',
            regex: '^\\d+$',
          },
        ],
      };

      const errors = [
        {
          field: 'type',
          errorProperties: {
            key: 'unknown_identifier_type',
            args: { type: identifierDto.applicationIdentifiers[0].type },
          },
        },
      ];
      const lang = 'en';
      const error = new FieldErrorsException(
        i18nService,
        HttpStatus.BAD_REQUEST,
        errors,
        lang,
      );

      mockIdentifierManagementService.upsertIdentifier.mockRejectedValue(error);

      await expect(controller.upsertIdentifier(identifierDto)).rejects.toThrow(
        FieldErrorsException,
      );
    });
  });

  describe('getIdentifier', () => {
    it('should call service.getIdentifier with namespace and return the result', async () => {
      const namespace = 'test-namespace';
      const identifierDto: IdentifierDto = {
        namespace,
        applicationIdentifiers: [
          {
            ai: '01',
            shortcode: 'A1',
            type: 'I',
            title: 'Title1',
            label: 'Label1',
            regex: '^\\d+$',
          },
        ],
      };

      mockIdentifierManagementService.getIdentifier.mockResolvedValue(
        identifierDto,
      );

      const result = await controller.getIdentifier(namespace);

      expect(service.getIdentifier).toHaveBeenCalledWith(namespace);
      expect(result).toEqual(identifierDto);
    });

    it('should call service.getIdentifiers if no namespace is provided and return the result', async () => {
      const identifierDtos: IdentifierDto[] = [
        {
          namespace: 'test-namespace1',
          applicationIdentifiers: [
            {
              ai: '01',
              shortcode: 'A1',
              type: 'I',
              title: 'Title1',
              label: 'Label1',
              regex: '^\\d+$',
            },
          ],
        },
        {
          namespace: 'test-namespace2',
          applicationIdentifiers: [
            {
              ai: '02',
              shortcode: 'A2',
              type: 'I',
              title: 'Title2',
              label: 'Label2',
              regex: '^\\d+$',
            },
          ],
        },
      ];

      mockIdentifierManagementService.getIdentifiers.mockResolvedValue(
        identifierDtos,
      );

      const result = await controller.getIdentifier('');

      expect(service.getIdentifiers).toHaveBeenCalled();
      expect(result).toEqual(identifierDtos);
    });

    it('should handle service errors', async () => {
      const namespace = 'non-existent-namespace';
      const error = new NotFoundException('Identifier not found');

      mockIdentifierManagementService.getIdentifier.mockRejectedValue(error);

      await expect(controller.getIdentifier(namespace)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteIdentifier', () => {
    it('should call service.deleteIdentifier and return undefined on success', async () => {
      const namespace = 'test-namespace';

      mockIdentifierManagementService.deleteIdentifier.mockResolvedValue(
        undefined,
      );

      const result = await controller.deleteIdentifier(namespace);

      expect(service.deleteIdentifier).toHaveBeenCalledWith(namespace);
      expect(result).toEqual({
        message: 'Application identifier deleted successfully',
      });
    });
  });
});
