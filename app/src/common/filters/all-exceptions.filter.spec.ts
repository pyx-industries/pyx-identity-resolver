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
    mockJson.mockClear();
    mockStatus.mockClear();
    mockGetResponse.mockClear();
    mockGetRequest.mockClear();
  });

  afterEach(() => {
    loggerSpy.mockRestore();
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

  it('should not log 4xx errors', () => {
    const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(error, mockHost);

    expect(loggerSpy).not.toHaveBeenCalled();
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
