---
sidebar_position: 5
title: Scaling
---

# Scaling

The IDR doesn't hold any in-memory state between requests
(beyond the Lambda handler cache in serverless mode).
All persistent data lives in a shared object storage bucket.
This makes scaling the **read path** (link resolution) straightforward --
you can add instances behind a load balancer
and they all serve from the same data.

**Write operations** (link registration, identifier management) are a different story.
All instances perform read-modify-write cycles against the same bucket
with no locking or optimistic concurrency control,
so concurrent writes to the same object risk a last-write-wins race condition.

This page covers practical guidance
for scaling the IDR at the **application and configuration level**.
It deliberately avoids infrastructure-specific orchestration
(Kubernetes manifests, Terraform modules, etc.)
because those choices depend on your platform.

## Configuration knobs

| Variable | Impact | Guidance |
|----------|--------|----------|
| `LINK_HEADER_MAX_SIZE` | Controls the maximum size of the `Link` response header. Larger values mean more link entries per response but increase bandwidth per request. | Keep the default `8192` (8 KB). Clients that need every link read the linkset, which the header always points to. Values of `16384` or more break Node.js HTTP clients for large identifiers and log a warning at startup. See [Link header size](#link-header-size). |
| `NODE_ENV` | When set to `production`, the app initialises in serverless mode (AWS Lambda handler) instead of binding to a port. **Any other value** --- including omitting the variable entirely --- starts a standard HTTP server. | For container deployments (Docker, Kubernetes, ECS), either omit `NODE_ENV` or set it to a value other than `production` (e.g. `development`). Only set `production` when deploying to AWS Lambda. See [Serverless](./serverless) for details. |

## Link header size

Every resolution response carries a `Link` header.
It always includes an `owl:sameAs` entry
and a `linkset` entry pointing at `?linkType=all`.
It also lists the target links for the resolved link type,
as long as they fit within `LINK_HEADER_MAX_SIZE`.
When they don't fit, the IDR drops all of them,
keeps the two mandatory entries
and logs `Link header truncated`.
No link is lost: clients read the full set from the linkset.

Registration appends links, and they stay until you delete them.
So an identifier whose credential is re-issued and re-registered regularly
gains a few hundred bytes of `Link` header with every version.

Clients and proxies limit the size of response headers,
and the `Link` header counts against those limits
together with every other response header:

| Client or proxy | Default limit |
|-----------------|---------------|
| Node.js `http` and `fetch` (undici) | 16 KiB for all response headers combined (`--max-http-header-size`). Larger responses fail with `UND_ERR_HEADERS_OVERFLOW`. |
| nginx as a reverse proxy | `proxy_buffer_size`, one memory page (4 KB or 8 KB). Larger upstream headers get a `502`. |
| Python `aiohttp` | 8190 bytes per header field. |

So keep `LINK_HEADER_MAX_SIZE` at the default unless you have measured a need.
At `16384` or more, the identifiers that fill the budget
fail for Node.js clients, and the IDR logs a warning at startup.
If you do raise it, raise the response header buffer
of any reverse proxy in front of the IDR as well.

## Logging

The IDR uses NestJS's built-in logger.
In a container deployment, logs are written to stdout,
making them easy to collect with any log aggregation tool
(CloudWatch, Datadog, ELK, Loki, etc.).

Log messages to watch for:

- **`LINK_HEADER_MAX_SIZE (... bytes) is at or above 16384 bytes`** --- emitted at startup when the budget is large enough to break Node.js HTTP clients. See [Link header size](#link-header-size).
- **`Link header truncated`** --- emitted at request time when the target links were dropped to stay within the header size budget. The `linkset` entry is still sent.
- **`APP_NAME is not defined`** --- the service will fail to start. Make sure `APP_NAME` is set.

## Next steps

- [Configuration](./configuration) --- adjust environment variables for performance.
- [CI/CD Pipeline](./ci-cd) --- understand how releases and images are produced.
