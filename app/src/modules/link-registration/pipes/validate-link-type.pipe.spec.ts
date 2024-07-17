import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AxiosResponse } from 'axios';
import { lastValueFrom, of, throwError } from 'rxjs';

import { ValidateLinkTypePipe } from './validate-link-type.pipe';
import { IdentifierManagementService } from '../../identifier-management/identifier-management.service';
import { FieldErrorsException } from '../../../common/exceptions/field-errors.exception';
import { CreateLinkRegistrationDto } from '../dto/link-registration.dto';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  lastValueFrom: jest.fn(),
}));

describe('ValidateLinkTypePipe', () => {
  let pipe: ValidateLinkTypePipe;
  let httpService: HttpService;
  let identifierManagementService: IdentifierManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateLinkTypePipe,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn(),
          },
        },
      ],
    }).compile();

    pipe = module.get<ValidateLinkTypePipe>(ValidateLinkTypePipe);
    httpService = module.get<HttpService>(HttpService);
    identifierManagementService = module.get<IdentifierManagementService>(
      IdentifierManagementService,
    );
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should validate a correct link type', async () => {
    const dto: CreateLinkRegistrationDto = {
      namespace: 'gs1',
      identificationKeyType: 'validIdentificationKeyType',
      identificationKey: '12345678901234',
      itemDescription: 'Product description',
      qualifierPath: '/10/LOT1234/21/SER5678',
      active: true,
      responses: [
        {
          linkType: 'gs1:certificationInfo',
          defaultLinkType: true,
          defaultMimeType: true,
          fwqs: false,
          active: true,
          title: 'Certification Information',
          targetUrl: 'https://example.com',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
          defaultIanaLanguage: true,
        },
      ],
    };

    jest.spyOn(identifierManagementService, 'getIdentifier').mockResolvedValue({
      namespaceProfile: 'https://example.com/voc/?show=linktypes',
      namespaceURI: 'https://example.com/uri',
      namespace: 'gs1',
      applicationIdentifiers: [],
    });

    const profileMock = {
      certificationInfo: {
        title: 'Certification Information',
        description: 'Details about certification',
        gs1key: 'gtin',
      },
    };

    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(
        of({ status: 200, data: profileMock } as AxiosResponse<unknown, any>),
      );

    (lastValueFrom as jest.Mock).mockResolvedValue({
      status: 200,
      data: profileMock,
    } as AxiosResponse<unknown, any>);

    const result = await pipe.transform(dto);

    expect(result).toEqual(dto);
  });

  it('should throw an error if the link type prefix does not match the namespace', async () => {
    const dto: CreateLinkRegistrationDto = {
      namespace: 'gs1',
      identificationKeyType: 'validIdentificationKeyType',
      identificationKey: '12345678901234',
      itemDescription: 'Product description',
      qualifierPath: '/10/LOT1234/21/SER5678',
      active: true,
      responses: [
        {
          linkType: 'wrongprefix:certificationInfo',
          defaultLinkType: true,
          defaultMimeType: true,
          fwqs: false,
          active: true,
          title: 'Certification Information',
          targetUrl: 'https://example.com',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
          defaultIanaLanguage: true,
        },
      ],
    };

    jest.spyOn(identifierManagementService, 'getIdentifier').mockResolvedValue({
      namespaceProfile: 'https://example.com/voc/?show=linktypes',
      namespaceURI: 'https://example.com/uri',
      namespace: 'gs1',
      applicationIdentifiers: [],
    });

    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(
        of({ status: 200, data: {} } as AxiosResponse<unknown, any>),
      );

    (lastValueFrom as jest.Mock).mockResolvedValue({
      status: 200,
      data: {},
    } as AxiosResponse<unknown, any>);
    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should throw an error if the link type is not valid', async () => {
    const dto: CreateLinkRegistrationDto = {
      namespace: 'gs1',
      identificationKeyType: 'validIdentificationKeyType',
      identificationKey: '12345678901234',
      itemDescription: 'Product description',
      qualifierPath: '/10/LOT1234/21/SER5678',
      active: true,
      responses: [
        {
          linkType: 'gs1:invalidLinkType',
          defaultLinkType: true,
          defaultMimeType: true,
          fwqs: false,
          active: true,
          title: 'Invalid Link Type',
          targetUrl: 'https://example.com',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
          defaultIanaLanguage: true,
        },
      ],
    };

    jest.spyOn(identifierManagementService, 'getIdentifier').mockResolvedValue({
      namespaceProfile: 'https://example.com/voc/?show=linktypes',
      namespaceURI: 'https://example.com/uri',
      namespace: 'gs1',
      applicationIdentifiers: [],
    });

    const profileMock = {
      certificationInfo: {
        title: 'Certification Information',
        description: 'Details about certification',
        gs1key: 'gtin',
      },
    };

    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(
        of({ status: 200, data: profileMock } as AxiosResponse<unknown, any>),
      );

    (lastValueFrom as jest.Mock).mockResolvedValue({
      status: 200,
      data: profileMock,
    });

    await expect(pipe.transform(dto)).rejects.toThrow(FieldErrorsException);
  });

  it('should throw a BadRequestException if the namespace profile fails to load', async () => {
    const dto: CreateLinkRegistrationDto = {
      namespace: 'gs1',
      identificationKeyType: 'validIdentificationKeyType',
      identificationKey: '12345678901234',
      itemDescription: 'Product description',
      qualifierPath: '/10/LOT1234/21/SER5678',
      active: true,
      responses: [
        {
          linkType: 'gs1:certificationInfo',
          defaultLinkType: true,
          defaultMimeType: true,
          fwqs: false,
          active: true,
          title: 'Certification Information',
          targetUrl: 'https://example.com',
          mimeType: 'application/json',
          ianaLanguage: 'en',
          context: 'au',
          defaultContext: true,
          defaultIanaLanguage: true,
        },
      ],
    };

    jest.spyOn(identifierManagementService, 'getIdentifier').mockResolvedValue({
      namespaceProfile: 'https://example.com/voc/?show=linktypes',
      namespaceURI: 'https://example.com/uri',
      namespace: 'gs1',
      applicationIdentifiers: [],
    });

    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(throwError(() => new Error('Request failed')));

    (lastValueFrom as jest.Mock).mockRejectedValue(new Error('Request failed'));

    await expect(pipe.transform(dto)).rejects.toThrow(BadRequestException);
  });
});
