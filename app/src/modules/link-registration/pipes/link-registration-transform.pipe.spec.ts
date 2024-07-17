import { Test, TestingModule } from '@nestjs/testing';
import { LinkRegistrationTransformPipe } from '../pipes/link-registration-transform.pipe';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';
import { IdentifierManagementService } from '../../identifier-management/identifier-management.service';
import { LinkRegistrationService } from '../link-registration.service';

describe('LinkRegistrationTransformPipe', () => {
  let pipe: LinkRegistrationTransformPipe;
  let identifierManagementService: IdentifierManagementService;
  let linkRegistrationService: LinkRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkRegistrationTransformPipe,
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
        {
          provide: LinkRegistrationService,
          useValue: {
            one: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<LinkRegistrationTransformPipe>(
      LinkRegistrationTransformPipe,
    );
    identifierManagementService = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
    linkRegistrationService = module.get<LinkRegistrationService>(
      LinkRegistrationService,
    );
  });

  describe('transform', () => {
    it('should combine the incoming data with the existing data', async () => {
      const existingData: CreateLinkRegistrationDto = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        itemDescription: '',
        qualifierPath: '',
        active: false,
        responses: [],
      };
      jest
        .spyOn(identifierManagementService, 'getIdentifier')
        .mockResolvedValue({
          namespace: 'testNamespace',
          applicationIdentifiers: [
            {
              ai: '01',
              shortcode: 'test',
              regex: '^.*$',
              type: 'I',
              qualifiers: ['10'],
              title: '',
              label: '',
            },
            {
              ai: '10',
              regex: '^.*$',
              type: 'Q',
              title: '',
              label: '',
              shortcode: '',
            },
          ],
        });
      jest
        .spyOn(linkRegistrationService, 'one')
        .mockResolvedValue(existingData);

      const incomingData: CreateLinkRegistrationDto = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        itemDescription: '',
        qualifierPath: '',
        active: false,
        responses: [
          {
            defaultLinkType: false,
            defaultMimeType: false,
            fwqs: false,
            active: false,
            linkType: 'testType',
            title: '',
            targetUrl: 'http://example.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'au',
            defaultContext: false,
            defaultIanaLanguage: false,
          },
        ],
      };

      const expectedResult: CreateLinkRegistrationDto = {
        namespace: 'testNamespace',
        identificationKeyType: 'test',
        identificationKey: 'testKey',
        itemDescription: '',
        qualifierPath: '',
        active: false,
        responses: [
          {
            defaultLinkType: false,
            defaultMimeType: false,
            fwqs: false,
            active: false,
            linkType: 'testType',
            title: '',
            targetUrl: 'http://example.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'au',
            defaultContext: false,
            defaultIanaLanguage: false,
          },
        ],
      };

      const result = await pipe.transform(incomingData);

      expect(result).toEqual(expectedResult);
    });
  });
});
