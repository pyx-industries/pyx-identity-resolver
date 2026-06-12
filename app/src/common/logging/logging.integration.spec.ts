import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  LoggerModule,
  Logger as PinoNestLogger,
  PinoLogger,
} from 'nestjs-pino';
import { Options } from 'pino-http';
import { Writable } from 'node:stream';
import request from 'supertest';
import { buildLoggerParams } from './logging.config';

@Controller()
class ProbeController {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('Probe');
  }

  @Get('ok')
  ok() {
    this.logger.info('handling request');
    return { ok: true };
  }

  @Get('boom')
  boom(): never {
    throw new Error('kaboom');
  }
}

describe('logging integration', () => {
  let app: INestApplication;
  let lines: Array<Record<string, any>>;

  beforeAll(async () => {
    process.env.LOG_PRETTY = 'false';
    lines = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        for (const line of chunk.toString().split('\n')) {
          if (line.trim()) lines.push(JSON.parse(line));
        }
        cb();
      },
    });

    @Module({
      imports: [
        LoggerModule.forRoot({
          pinoHttp: [buildLoggerParams().pinoHttp as Options, stream],
        }),
      ],
      controllers: [ProbeController],
    })
    class ProbeModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [ProbeModule],
    }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(PinoNestLogger));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.LOG_PRETTY;
  });

  beforeEach(() => {
    lines.length = 0;
  });

  it('binds the same request id to the manual and completion log lines', async () => {
    await request(app.getHttpServer()).get('/ok');
    const manual = lines.find((l) => l.msg === 'handling request');
    const completion = lines.find((l) => l.msg === 'request completed');
    expect(manual?.reqId).toBeDefined();
    expect(completion?.reqId).toBe(manual?.reqId);
  });

  it('redacts the authorization and cookie headers in the request log', async () => {
    await request(app.getHttpServer())
      .get('/ok')
      .set('authorization', 'Bearer super-secret')
      .set('cookie', 'session=secret-cookie');
    const completion = lines.find((l) => l.req?.headers);
    expect(completion?.req.headers.authorization).toBe('[REDACTED]');
    expect(completion?.req.headers.cookie).toBe('[REDACTED]');
    expect(JSON.stringify(lines)).not.toContain('super-secret');
    expect(JSON.stringify(lines)).not.toContain('secret-cookie');
  });

  it('logs 5xx responses at error level', async () => {
    const res = await request(app.getHttpServer()).get('/boom');
    expect(res.status).toBe(500);
    const completion = lines.find((l) => l.msg === 'request errored');
    expect(completion?.level).toBe(50); // pino error level
  });
});
