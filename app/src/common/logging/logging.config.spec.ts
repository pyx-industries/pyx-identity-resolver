import { buildLoggerParams } from './logging.config';

const pinoHttp = () => buildLoggerParams().pinoHttp as any;

describe('buildLoggerParams', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_PRETTY;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('defaults the level to info', () => {
    expect(pinoHttp().level).toBe('info');
  });

  it('honours LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'debug';
    expect(pinoHttp().level).toBe('debug');
  });

  it('quiets the req logger so manual log lines stay lean', () => {
    expect(pinoHttp().quietReqLogger).toBe(true);
  });

  it('redacts the authorization and cookie headers', () => {
    expect(pinoHttp().redact).toEqual({
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      censor: '[REDACTED]',
    });
  });

  it('maps status codes to levels: 5xx error, 4xx warn, else info', () => {
    const level = pinoHttp().customLogLevel;
    expect(level({}, { statusCode: 503 })).toBe('error');
    expect(level({}, { statusCode: 200 }, new Error('x'))).toBe('error');
    expect(level({}, { statusCode: 404 })).toBe('warn');
    expect(level({}, { statusCode: 302 })).toBe('info');
    expect(level({}, { statusCode: 200 })).toBe('info');
  });

  describe('pretty transport selection', () => {
    it('enables the pretty transport when LOG_PRETTY is true', () => {
      process.env.LOG_PRETTY = 'true';
      process.env.NODE_ENV = 'production';
      expect(pinoHttp().transport?.target).toBe('pino-pretty');
    });

    it('disables the pretty transport when LOG_PRETTY is false, even in development', () => {
      process.env.LOG_PRETTY = 'false';
      process.env.NODE_ENV = 'development';
      expect(pinoHttp().transport).toBeUndefined();
    });

    it('defaults the pretty transport on in development when LOG_PRETTY is unset', () => {
      process.env.NODE_ENV = 'development';
      expect(pinoHttp().transport?.target).toBe('pino-pretty');
    });

    it('defaults the pretty transport off outside development when LOG_PRETTY is unset', () => {
      process.env.NODE_ENV = 'production';
      expect(pinoHttp().transport).toBeUndefined();
    });

    it('treats any value other than the string true as off', () => {
      process.env.LOG_PRETTY = 'TRUE';
      process.env.NODE_ENV = 'production';
      expect(pinoHttp().transport).toBeUndefined();
    });
  });
});
