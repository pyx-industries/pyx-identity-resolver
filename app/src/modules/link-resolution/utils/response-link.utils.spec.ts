import { ResolvedLink } from '../interfaces/link-resolution.interface';
import { responseResolvedLink } from './response-link.utils';

describe('responseResolvedLink', () => {
  let mockResponse: any;
  let mockRequest: any;
  let resolvedLink: ResolvedLink;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      redirect: jest.fn(),
      setHeader: jest.fn(),
      json: jest.fn(),
    };
    mockRequest = {
      accepts: jest.fn().mockReturnValue(['application/json', 'text/html']),
    };
  });

  it('should redirect to the targetUrl', () => {
    resolvedLink = {
      targetUrl: 'https://example.com',
      data: undefined,
      mimeType: 'text/html',
      fwqs: false,
      linkHeaderText: '',
    };
    responseResolvedLink(mockResponse, mockRequest, resolvedLink);

    expect(mockResponse.redirect).toHaveBeenCalledWith(resolvedLink.targetUrl);
  });

  it('should return the data', () => {
    resolvedLink = {
      targetUrl: undefined,
      data: { key: 'value' },
      mimeType: 'application/json',
      fwqs: false,
      linkHeaderText: '',
    };
    responseResolvedLink(mockResponse, mockRequest, resolvedLink);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(resolvedLink.data);
  });

  it('should forward query string to the targetUrl when targetUrl has no queryString', () => {
    resolvedLink = {
      targetUrl: 'https://example.com',
      data: undefined,
      mimeType: 'text/html',
      fwqs: true,
      linkHeaderText: '',
    };
    mockRequest.query = { key: 'value' };
    responseResolvedLink(mockResponse, mockRequest, resolvedLink);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      `${resolvedLink.targetUrl}?key=value`,
    );
  });

  it('should forward query string to the targetUrl when targetUrl has queryString', () => {
    resolvedLink = {
      targetUrl: 'https://example.com?query=string',
      data: undefined,
      mimeType: 'text/html',
      fwqs: true,
      linkHeaderText: '',
    };
    mockRequest.query = { key: 'value' };
    responseResolvedLink(mockResponse, mockRequest, resolvedLink);

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      `${resolvedLink.targetUrl}&key=value`,
    );
  });

  it('should redirect to targetUrl when fwqs is true and no query string', () => {
    resolvedLink = {
      targetUrl: 'https://example.com',
      data: undefined,
      mimeType: 'text/html',
      fwqs: true,
      linkHeaderText: '',
    };
    responseResolvedLink(mockResponse, mockRequest, resolvedLink);

    expect(mockResponse.redirect).toHaveBeenCalledWith(resolvedLink.targetUrl);
  });
});
