# ADR 002: nestjs-pino as the structured logging foundation

- **Date:** 2026-06-12
- **Status:** accepted

## Context

The Identity Resolver emits no production-grade logs. Logging is ad-hoc: a handful of NestJS `Logger` instances scattered across services, a module-level logger in a utility file, and a stray `console.error`. Output is unstructured text, there is no machine-parseable format for log aggregation, no consistent way to trace the log lines belonging to a single request, and no redaction of secrets such as the API key carried in the `Authorization` header.

A parallel workstream is adding OpenTelemetry instrumentation to this service, so the logging design must align with distributed tracing rather than compete with it.

The work is delivered in stages: first the logging foundation (this decision), then correlation-ID propagation, then the migration of existing log sites and step-level breadcrumb logging. The correlation-ID contract (accepted header formats, validation, echo behaviour) is a separate decision recorded when that stage lands.

## Decision

Adopt `nestjs-pino` (which wraps `pino` and `pino-http`) as the single logging foundation for the service, registered once via a `LoggingModule` wrapper (nestjs-pino's `LoggerModule.forRoot` is global) and installed as the application logger via `app.useLogger(...)` with `bufferLogs: true`.

`nestjs-pino` provides the pattern this problem calls for, productised for NestJS: per-request child loggers backed by AsyncLocalStorage, automatic HTTP request/response logging at the boundary, and request-scoped fields on every log line without manually threading context through call sites. The target is an observable contract (structured JSON, request-scoped identity on every line, secrets redacted, trace alignment), and `nestjs-pino` delivers it with the least bespoke code to own.

Configuration is built in one place (`buildLoggerParams()` in `src/common/logging/logging.config.ts`) and driven by environment variables:

- `LOG_LEVEL` selects the minimum level (default `info`).
- `LOG_PRETTY` toggles human-readable output via `pino-pretty` (default on in development, off otherwise; JSON in production).
- The `Authorization` and `Cookie` request headers are redacted with pino `redact` paths, because the API key arrives as `Authorization: Bearer <key>`.
- Response status maps to log level: 5xx and errors log at `error`, 4xx at `warn`, everything else at `info`. 3xx stays at `info` because redirects are the resolver's core success path, not noise.
- A documented extension point in the config is reserved for the OpenTelemetry workstream to add a `mixin` emitting `trace_id`/`span_id` from the active span, so tracing integration requires no call-site changes.

## Consequences

**Easier:**

- Logs are structured JSON, ready for ingestion by log aggregation and the observability stack, with pretty-printing for local development.
- Every request gets HTTP boundary logging for free from `pino-http`: a completion line carrying the latency and a status-mapped level.
- Request-scoped fields attach to every log line via the per-request child logger, which is the substrate the correlation-ID stage builds on without further plumbing.
- Framework and bootstrap logs route through the same pipeline (`app.useLogger` plus `bufferLogs`), so existing `Logger` call sites emit JSON immediately, even before they are migrated to the injected logger.
- Secrets in request headers can no longer leak into logs.
- The OpenTelemetry workstream has a single, documented integration point instead of a parallel logging arrangement.

**Harder:**

- A third-party integration layer sits between the application and Pino; major NestJS upgrades must wait for `nestjs-pino` compatibility.
- Log-sensitive tests must capture and parse the JSON stream rather than spying on `Logger.prototype`, which is more setup per test.
- Local log output changes shape; anyone grepping the old text format must adjust.

## Alternatives Considered

**Hand-rolled Pino core (an AsyncLocalStorage request store, custom mixin, custom request middleware).** Rejected. It reimplements exactly what `nestjs-pino` already provides on NestJS and adds a bespoke `LoggerService` bridge and request middleware to maintain, with no behavioural gain over the off-the-shelf integration.

**NestJS built-in `Logger` with a custom JSON formatter.** Rejected. The built-in logger has no per-request context propagation, no redaction, no HTTP boundary logging, and no ecosystem of transports. Every one of those would become bespoke code to build and maintain.

**`pino-http` wired manually without `nestjs-pino`.** Rejected. It provides the HTTP boundary logging but not the NestJS dependency-injection integration (`Logger`/`PinoLogger` injectables, `useLogger` bridge), so services could not receive the logger idiomatically and the framework logs would stay outside the pipeline.

## References

- nestjs-pino: https://github.com/iamolegga/nestjs-pino
- Related workstream: OpenTelemetry instrumentation
