import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LinkRegistrationTransformPipe } from './pipes/link-registration-transform.pipe';
import { CreateLinkRegistrationDto } from './dto/link-registration.dto';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { LinkRegistrationService } from './link-registration.service';
import { normaliseDocument } from './utils/version.utils';

/**
 * Backwards-compatibility tests for deprecated itemDescription field.
 * TODO(v3.0): Remove when itemDescription support is dropped.
 */
describe('itemDescription backwards compatibility (remove in v3.0)', () => {
  let pipe: LinkRegistrationTransformPipe;

  const mockIdentifierManagementService = {
    getIdentifier: jest.fn().mockResolvedValue({
      namespace: 'testNamespace',
      applicationIdentifiers: [
        {
          ai: '01',
          shortcode: 'test',
          regex: '^.*$',
          type: 'I',
          qualifiers: [],
          title: '',
          label: '',
        },
      ],
    }),
  };

  const mockLinkRegistrationService = {
    one: jest.fn().mockResolvedValue({
      namespace: 'testNamespace',
      identificationKeyType: 'test',
      identificationKey: 'testKey',
      description: '',
      qualifierPath: '/',
      active: false,
      responses: [],
    }),
  };

  const baseResponses = [
    {
      defaultLinkType: false,
      defaultMimeType: false,
      fwqs: false,
      active: false,
      linkType: 'testType',
      title: 'Test',
      targetUrl: 'http://example.com',
      mimeType: 'text/html',
      ianaLanguage: 'en',
      context: 'au',
      defaultContext: false,
      defaultIanaLanguage: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkRegistrationTransformPipe,
        {
          provide: IdentifierManagementService,
          useValue: mockIdentifierManagementService,
        },
        {
          provide: LinkRegistrationService,
          useValue: mockLinkRegistrationService,
        },
      ],
    }).compile();

    pipe = module.get<LinkRegistrationTransformPipe>(
      LinkRegistrationTransformPipe,
    );
  });

  describe('Transform pipe', () => {
    it('should remove itemDescription from the DTO when only itemDescription is provided', async () => {
      const input = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        description: 'Copied from itemDescription by @Transform',
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
        itemDescription: 'Old field value',
      } as CreateLinkRegistrationDto & { itemDescription?: string };

      const result = await pipe.transform(input);

      expect((result as any).itemDescription).toBeUndefined();
    });

    it('should prefer description over itemDescription when both are provided', async () => {
      // The @Transform on the DTO resolves description ?? itemDescription before the pipe runs.
      // We simulate the post-transform state: description already holds the winning value.
      const plain = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        description: 'Canonical description',
        itemDescription: 'Legacy value',
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
      };

      const dto = plainToClass(CreateLinkRegistrationDto, plain);

      // After class-transformer runs the @Transform, description should be 'Canonical description'
      // because it uses ?? (nullish coalescing): description is non-null so itemDescription is ignored.
      expect(dto.description).toBe('Canonical description');

      // The pipe should then strip the leftover itemDescription field.
      const result = await pipe.transform(dto);
      expect((result as any).itemDescription).toBeUndefined();
      expect((result as any).description).toBe('Canonical description');
    });
  });

  describe('normaliseDocument (storage read path)', () => {
    it('should convert itemDescription to description when reading a stored document', () => {
      const doc = {
        itemDescription: 'Legacy stored value',
        responses: [],
      } as any;

      const result = normaliseDocument(doc);

      expect(result.description).toBe('Legacy stored value');
      expect((result as any).itemDescription).toBeUndefined();
    });

    it('should not overwrite description with itemDescription when both are present', () => {
      const doc = {
        description: 'Current description',
        itemDescription: 'Old legacy value',
        responses: [],
      } as any;

      const result = normaliseDocument(doc);

      expect(result.description).toBe('Current description');
      expect((result as any).itemDescription).toBeUndefined();
    });
  });

  describe('DTO validation', () => {
    it('should fail validation when neither description nor itemDescription is provided', async () => {
      const plain = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        // description omitted, itemDescription omitted
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
      };

      const dto = plainToClass(CreateLinkRegistrationDto, plain);
      const errors = await validate(dto);

      const descriptionError = errors.find((e) => e.property === 'description');
      expect(descriptionError).toBeDefined();
    });

    it('should pass validation when description is populated (as the framework does via @Transform from itemDescription)', async () => {
      // The NestJS ValidationPipe with transform:true fires the @Transform at the HTTP layer,
      // copying itemDescription → description when only itemDescription is present.
      // We simulate the post-transform state here: description already holds the copied value.
      const plain = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        description: 'Legacy value only', // as if copied from itemDescription by the framework
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
      };

      const dto = plainToClass(CreateLinkRegistrationDto, plain);

      expect(dto.description).toBe('Legacy value only');

      const errors = await validate(dto);
      const descriptionError = errors.find((e) => e.property === 'description');
      expect(descriptionError).toBeUndefined();
    });
  });
});
