/* eslint-disable @typescript-eslint/no-unused-vars */
import { LinkResolutionDto } from '../dto/link-resolution.dto';
import * as Negotiator from 'negotiator';
import { IdentifierParams } from './identifier-params.decorator';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import * as httpMock from 'node-mocks-http';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

jest.mock('negotiator');

describe('IdentifierParams', () => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  function getParamDecoratorFactory(decorator: Function) {
    class Test {
      public test(@IdentifierParams() value) {}
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  beforeEach(() => {
    (Negotiator as any).mockImplementation(() => ({
      mediaTypes: () => ['application/json'],
      languages: () => ['en-US', 'fr'],
    }));
  });

  it('should return the identifier parameters', () => {
    const req = httpMock.createRequest();
    const res = httpMock.createResponse();
    req.params = {
      namespace: 'idr',
      identifierKeyType: 'gtin',
      identifierKey: '9359502000041',
      '0': '10/abc123',
    };
    req.query = {
      linkType: 'idr:certificationInfo',
    };
    req.headers = {
      'accept-language': 'en-US, fr;q=0.9',
      accept: 'application/json',
    };

    const factory = getParamDecoratorFactory(LinkResolutionDto);
    const result = factory(
      null,
      new ExecutionContextHost([req, res, null, null]),
    );

    expect(result).toEqual({
      namespace: 'idr',
      identifiers: {
        primary: {
          qualifier: 'gtin',
          id: '9359502000041',
        },
        secondaries: [
          {
            qualifier: '10',
            id: 'abc123',
          },
        ],
      },
      descriptiveAttributes: {
        linkType: 'idr:certificationInfo',
        mimeTypes: ['application/json'],
        ianaLanguageContexts: [
          {
            ianaLanguage: 'en',
            context: 'US',
          },
          {
            ianaLanguage: 'fr',
            context: 'xx',
          },
        ],
      },
    });
  });

  it('should return the identifier parameters with secondary identifiers path', () => {
    const req = httpMock.createRequest();
    const res = httpMock.createResponse();
    req.params = {
      namespace: 'idr',
      identifierKeyType: 'gtin',
      identifierKey: '9359502000041',
      secondaryIdentifiersPath: '10/abc123',
    };
    req.query = {
      linkType: 'idr:certificationInfo',
    };
    req.headers = {
      'accept-language': 'en-US, fr;q=0.9',
      accept: 'application/json',
    };

    const factory = getParamDecoratorFactory(LinkResolutionDto);
    const result = factory(
      null,
      new ExecutionContextHost([req, res, null, null]),
    );

    expect(result).toEqual({
      namespace: 'idr',
      identifiers: {
        primary: {
          qualifier: 'gtin',
          id: '9359502000041',
        },
        secondaries: [
          {
            qualifier: '10',
            id: 'abc123',
          },
        ],
      },
      descriptiveAttributes: {
        linkType: 'idr:certificationInfo',
        mimeTypes: ['application/json'],
        ianaLanguageContexts: [
          {
            ianaLanguage: 'en',
            context: 'US',
          },
          {
            ianaLanguage: 'fr',
            context: 'xx',
          },
        ],
      },
    });
  });

  it('should throw an error when the request data is invalid', () => {
    const req = httpMock.createRequest();
    const res = httpMock.createResponse();
    req.params = {
      namespace: 'idr',
      identifierKeyType: 'gtin',
      identifierKey: '9359502000041',
      '0': '10',
    };
    req.query = {
      linkType: 'idr:certificationInfo',
    };
    req.headers = {
      'accept-language': 'en-US, fr;q=0.9',
      accept: 'application/json',
    };

    const factory = getParamDecoratorFactory(LinkResolutionDto);

    expect(() =>
      factory(null, new ExecutionContextHost([req, res, null, null])),
    ).toThrow('Invalid request data');
  });
});
