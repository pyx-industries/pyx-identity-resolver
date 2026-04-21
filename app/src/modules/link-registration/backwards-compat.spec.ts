import { Test, TestingModule } from '@nestjs/testing';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { LinkRegistrationTransformPipe } from './pipes/link-registration-transform.pipe';
import { CreateLinkRegistrationDto } from './dto/link-registration.dto';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { LinkRegistrationService } from './link-registration.service';
import { normaliseDocument } from './utils/version.utils';

/**
 * Backwards-compatibility tests for the deprecated itemDescription field.
 *
 * The normalisation from itemDescription -> description on inbound requests
 * is performed by ItemDescriptionNormalisationMiddleware (covered separately
 * in middleware/item-description-normalisation.middleware.spec.ts). These
 * tests cover the remaining surfaces:
 *   - the request-path pipe that strips the leftover itemDescription field,
 *   - the storage read path that normalises legacy stored documents,
 *   - the DTO's description constraint (still required post-normalisation).
 */
describe('itemDescription backwards compatibility', () => {
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

  describe('LinkRegistrationTransformPipe', () => {
    it('strips the leftover itemDescription field from the DTO', async () => {
      // By the time the request reaches this pipe the middleware has already
      // copied itemDescription into description. The pipe is responsible for
      // removing the deprecated field so it does not reach storage.
      const input = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        description: 'Canonical description',
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
        itemDescription: 'Legacy value',
      } as CreateLinkRegistrationDto & { itemDescription?: string };

      const result = await pipe.transform(input);

      expect((result as any).itemDescription).toBeUndefined();
      expect(result.description).toBe('Canonical description');
    });
  });

  describe('normaliseDocument (storage read path)', () => {
    it('converts itemDescription to description when reading a stored document', () => {
      const doc = {
        itemDescription: 'Legacy stored value',
        responses: [],
      } as any;

      const result = normaliseDocument(doc);

      expect(result.description).toBe('Legacy stored value');
      expect((result as any).itemDescription).toBeUndefined();
    });

    it('does not overwrite description with itemDescription when both are present', () => {
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
    it('fails validation when description is not populated', async () => {
      // If the middleware has not copied itemDescription across (e.g. because
      // neither field was provided) the DTO must still reject the request.
      const plain = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
      };

      const dto = plainToClass(CreateLinkRegistrationDto, plain);
      const errors = await validate(dto);

      const descriptionError = errors.find((e) => e.property === 'description');
      expect(descriptionError).toBeDefined();
    });

    it('passes validation once description is populated (post-middleware state)', async () => {
      // Simulates the state after ItemDescriptionNormalisationMiddleware has
      // copied the legacy itemDescription value onto description.
      const plain = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        description: 'Legacy value only',
        qualifierPath: '/',
        active: false,
        responses: baseResponses,
      };

      const dto = plainToClass(CreateLinkRegistrationDto, plain);
      const errors = await validate(dto);
      const descriptionError = errors.find((e) => e.property === 'description');
      expect(descriptionError).toBeUndefined();
    });
  });
});
