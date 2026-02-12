import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let loggerSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
  const mockGetRequest = jest
    .fn()
    .mockReturnValue({ url: '/test', method: 'GET' });
  const mockHost = {
    switchToHttp: () => ({
      getResponse: mockGetResponse,
      getRequest: mockGetRequest,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    mockJson.mockClear();
    mockStatus.mockClear();
    mockGetResponse.mockClear();
    mockGetRequest.mockClear();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should log 500 errors with method, URL, and stack trace', () => {
    const error = new Error('Something broke');

    filter.catch(error, mockHost);

    expect(loggerSpy).toHaveBeenCalledTimes(1);
    const [message, stack] = loggerSpy.mock.calls[0];
    expect(message).toContain('GET');
    expect(message).toContain('/test');
    expect(stack).toContain('Something broke');
  });

  it('should not log 4xx errors (except 401/403)', () => {
    const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(error, mockHost);

    expect(loggerSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should warn-log 401 errors', () => {
    const error = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(error, mockHost);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain('GET');
    expect(message).toContain('/test');
    expect(message).toContain('401');
    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it('should warn-log 403 errors', () => {
    const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(error, mockHost);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message] = warnSpy.mock.calls[0];
    expect(message).toContain('403');
    expect(loggerSpy).not.toHaveBeenCalled();
  });

  it('should handle filter errors gracefully without throwing', () => {
    const originalImpl = mockStatus.getMockImplementation();
    mockStatus.mockImplementation(() => {
      throw new Error('Response stream destroyed');
    });
    const originalError = new Error('Original failure');

    expect(() => filter.catch(originalError, mockHost)).not.toThrow();
    expect(loggerSpy).toHaveBeenCalled();

    mockStatus.mockImplementation(originalImpl);
  });

  it('should return generic error body for non-HttpExceptions', () => {
    const error = new Error('Unexpected failure');

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/test',
        error: 'Internal server error',
      }),
    );
  });
});
