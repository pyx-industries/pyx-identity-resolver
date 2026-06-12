import { IncomingMessage, ServerResponse } from 'node:http';
import { stdSerializers } from 'pino';
import { Params } from 'nestjs-pino';

const isPretty = (): boolean =>
  process.env.LOG_PRETTY !== undefined
    ? process.env.LOG_PRETTY === 'true'
    : process.env.NODE_ENV === 'development';

/**
 * Build the nestjs-pino parameters.
 *
 * `quietReqLogger` keeps per-request child loggers lean: manual log lines
 * carry a flat `reqId` field rather than the full serialised request. The
 * marked extension point is where the OpenTelemetry workstream adds a `mixin`
 * for trace/span IDs.
 */
export const buildLoggerParams = (): Params => ({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    quietReqLogger: true,
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      censor: '[REDACTED]',
    },
    serializers: { err: stdSerializers.err },
    // OTEL INTEGRATION POINT: the OpenTelemetry workstream adds a `mixin` here
    // that emits trace_id/span_id from the active span. No call-site changes
    // are required when it lands.
    transport: isPretty()
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  },
});
