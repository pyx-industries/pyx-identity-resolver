import { I18nService } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { LinkRegistrationController } from './link-registration.controller';
import { LinkRegistrationService } from './link-registration.service';
import { CreateLinkRegistrationDto } from './dto/link-registration.dto';
import { RepositoryModule } from '../../repository/repository.module';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';

describe('LinkRegistrationController', () => {
  let controller: LinkRegistrationController;
  let linkRegistrationService: LinkRegistrationService;

  beforeEach(async () => {
    // Create a testing module
    const module: TestingModule = await Test.createTestingModule({
      imports: [RepositoryModule, ConfigModule, HttpModule],
      controllers: [LinkRegistrationController],
      providers: [
        {
          provide: 'LinkRegistrationValidationPipe',
          useValue: {
            transform: jest.fn(),
          },
        },
        { provide: 'RepositoryProvider', useValue: { one: jest.fn() } }, // the mock for RepositoryProvider
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn().mockImplementation((key) => key),
          },
        },
        {
          provide: LinkRegistrationService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get instances of the LinkRegistrationController and LinkRegistrationService
    controller = module.get<LinkRegistrationController>(
      LinkRegistrationController,
    );
    linkRegistrationService = module.get<LinkRegistrationService>(
      LinkRegistrationService,
    );
  });

  it('should be defined', () => {
    // Assert that the controller is defined
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw a bad request error for invalid namespace', async () => {
      const payload = {
        namespace: '',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'namespace should not be empty',
        );
      }
    });

    it('should throw a bad request error for invalid identificationKeyType', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: '',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [],
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'identificationKeyType should not be empty',
        );
      }
    });

    it('should throw a bad request error for invalid identificationKey', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: '',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [],
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'identificationKey should not be empty',
        );
      }
    });

    it('should throw a bad request error for invalid qualifierPath', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: 1 as any,
        active: true,
        responses: [],
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'qualifierPath must be a string',
        );
      }
    });

    it('should throw a bad request error for invalid itemDescription', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: '',
        qualifierPath: '/',
        active: true,
        responses: [],
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'itemDescription should not be empty',
        );
      }
    });

    it('should throw a bad request error for invalid active', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: '1' as any,
        responses: [],
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'active must be a boolean value',
        );
      }
    });

    it('should throw a bad request error for invalid responses', async () => {
      const payload = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: null,
      };

      try {
        await controller.create(payload as CreateLinkRegistrationDto);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses must be an array',
        );
        expect(error.getResponse().message).toContain(
          'each value in nested property responses must be either object or array',
        );
      }
    });

    it("should throw a bad request error for invalid response's defaultLinkType", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: '' as any,
            defaultMimeType: true,
            fwqs: false,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.defaultLinkType must be a boolean value',
        );
      }
    });

    it("should throw a bad request error for invalid response's defaultMimeType", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: '' as any,
            fwqs: false,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.defaultMimeType must be a boolean value',
        );
      }
    });

    it("should throw a bad request error for invalid response's fwqs", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: '1' as any,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.fwqs must be a boolean value',
        );
      }
    });

    it("should throw a bad request error for invalid response's active", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: false,
            active: '1' as any,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.active must be a boolean value',
        );
      }
    });

    it("should throw a bad request error for invalid response's linkType", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: false,
            active: true,
            linkType: 'invalidLinkType',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.linkType must be one of the following values: ' +
            'gs1:allergenInfo, gs1:appDownload, gs1:activityIdeas, ' +
            'gs1:brandHomepageClinical, gs1:brandHomepagePatient, gs1:careersInfo, ' +
            'gs1:certificationInfo, gs1:consumerHandlingStorageInfo, gs1:defaultLink, ' +
            'gs1:defaultLinkMulti, gs1:epcis, gs1:epil, gs1:eventsInfo, gs1:scheduleTime., ' +
            'gs1:faqs, gs1:handledBy, gs1:hasRetailers, gs1:homepage, gs1:ingredientsInfo, ' +
            'gs1:instructions, gs1:jws, gs1:leaveReview, gs1:locationInfo, gs1:logisticsInfo, ' +
            'gs1:openingHoursInfo, gs1:logisticsInfo, gs1:loyaltyProgram, gs1:masterData, ' +
            'gs1:menuInfo, gs1:allergenInfo, gs1:ingredientsInfo ., gs1:nutritionalInfo, ' +
            'gs1:paymentLink, gs1:pip, gs1:productSustainabilityInfo, gs1:sustainabilityInfo, ' +
            'gs1:promotion, gs1:purchaseSuppliesOrAccessories, gs1:quickStartGuide, ' +
            'gs1:recallStatus, gs1:recipeInfo, gs1:registerProduct, gs1:registryEntry, ' +
            'gs1:relatedImage, gs1:relatedVideo, gs1:review, gs1:safetyInfo, gs1:scheduleTime, ' +
            'gs1:serviceInfo, gs1:smartLabel, gs1:smpc, gs1:socialMedia, gs1:statisticInfo, ' +
            'gs1:subscribe, gs1:support, gs1:traceability, gs1:tutorial, gs1:userAgreement, ' +
            'gs1:verificationService, gs1:whatsInTheBox, dlr:certificationInfo',
        );
      }
    });

    it("should throw a bad request error for invalid response's linkTitle", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: false,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: '', // cannot be empty
            targetUrl: 'https://test.com',
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.linkTitle should not be empty',
        );
      }
    });

    it("should throw a bad request error for invalid response's targetUrl", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: false,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'invalidUrl', // invalid URL
            mimeType: 'text/html',
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.targetUrl must be a URL address',
        );
      }
    });

    it("should throw a bad request error for invalid response's mimeType", async () => {
      const payload: CreateLinkRegistrationDto = {
        namespace: 'gs1',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '/',
        active: true,
        responses: [
          {
            defaultLinkType: true,
            defaultMimeType: true,
            fwqs: false,
            active: true,
            linkType: 'dlr:certificationInfo',
            title: 'testLinkTitle',
            targetUrl: 'https://test.com',
            mimeType: 'invalidMimeType', // invalid MIME type
            ianaLanguage: 'en',
            context: 'us',
            defaultContext: true,
            defaultIanaLanguage: true,
          },
        ],
      };

      try {
        await controller.create(payload);
      } catch (error) {
        // Assert that the error status is 400
        expect(error.getStatus()).toBe(400);
        // Assert that the error message contains the expected error message
        expect(error.getResponse().message).toContain(
          'responses.0.mimeType must be one of the following values: application/pdf, ' +
            'application/postscript, application/zip, image/jpeg, image/png, image/gif, ' +
            'image/bmp, image/svg+xml, text/plain, text/html, text/css, text/csv, ' +
            'text/javascript, text/xml',
        );
      }
    });

    it('should create a new registration and return success message', async () => {
      // Define the payload object for the registration
      const payload: CreateLinkRegistrationDto = {
        namespace: 'testNamespace',
        identificationKeyType: 'testKeyType',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      const successMessage = 'successes.register_link_resolver_successfully';
      // Mock the create method of the registration service to return the success message
      jest
        .spyOn(linkRegistrationService, 'create')
        .mockResolvedValue({ message: successMessage });

      const result = await controller.create(payload);

      // Assert that the create method of the registration service was called with the payload
      expect(linkRegistrationService.create).toHaveBeenCalledWith(payload);

      // Assert that the result is equal to the expected success message
      expect(result).toEqual({ message: successMessage });
    });
  });
});
