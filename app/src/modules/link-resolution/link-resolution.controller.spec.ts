import { Test, TestingModule } from '@nestjs/testing';
import { LinkResolutionController } from './link-resolution.controller';
import { LinkResolutionService } from './link-resolution.service';
import { responseResolvedLink } from './utils/response-link.utils';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { IdentifierSetValidationPipe } from '../identifier-management/pipes/identifier-set-validation.pipe';

jest.mock('./utils/response-link.utils', () => ({
  responseResolvedLink: jest.fn(),
}));

describe('LinkResolutionController', () => {
  let controller: LinkResolutionController;
  let mockService: LinkResolutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkResolutionController],
      providers: [
        {
          provide: LinkResolutionService,
          useValue: {
            resolve: jest.fn(),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn(),
          },
        },
      ],
    })
      .overridePipe(IdentifierSetValidationPipe)
      .useValue(jest.fn())
      .compile();

    controller = module.get<LinkResolutionController>(LinkResolutionController);
    mockService = module.get(LinkResolutionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should resolve a link', async () => {
    const mockRequest: any = {};
    const mockResponse: any = {};
    const resolvedLink = {
      targetUrl: 'https://example.com',
      data: undefined,
      mimeType: 'text/html',
      fwqs: false,
    };

    mockService.resolve = jest.fn().mockResolvedValue(resolvedLink);

    await controller.resolve(
      {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '123',
            qualifier: '01',
          },
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
        },
      },
      mockRequest,
      mockResponse,
    );

    expect(mockService.resolve).toHaveBeenCalled();
    expect(responseResolvedLink).toHaveBeenCalledWith(
      mockResponse,
      mockRequest,
      resolvedLink,
    );
  });

  it('should resolve a link with secondary identifiers path', async () => {
    const mockRequest: any = {};
    const mockResponse: any = {};
    const resolvedLink = {
      targetUrl: 'https://example.com',
      data: undefined,
      mimeType: 'text/html',
      fwqs: false,
    };

    mockService.resolve = jest.fn().mockResolvedValue(resolvedLink);

    await controller.resolveClone(
      {
        namespace: 'idr',
        identifiers: {
          primary: {
            id: '123',
            qualifier: '01',
          },
          secondaries: [
            {
              id: '456',
              qualifier: '10',
            },
          ],
        },
        descriptiveAttributes: {
          linkType: 'idr:certificationInfo',
          ianaLanguage: 'en',
          context: 'us',
          mimeType: 'application/json',
        },
      },
      mockRequest,
      mockResponse,
    );

    expect(mockService.resolve).toHaveBeenCalled();
    expect(responseResolvedLink).toHaveBeenCalledWith(
      mockResponse,
      mockRequest,
      resolvedLink,
    );
  });
});
