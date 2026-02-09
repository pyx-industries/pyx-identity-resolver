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
| `LINK_HEADER_MAX_SIZE` | Controls the maximum size of the `Link` response header. Larger values mean more link entries per response but increase bandwidth per request. | Default `8192` (8 KB) works well for most cases. Increase to `16384` or `32768` if your identifiers have many registered link types. Going above `65536` (64 KB) is not recommended. |
| `NODE_ENV` | When set to `production`, the app initialises in serverless mode (AWS Lambda handler) instead of binding to a port. **Any other value** --- including omitting the variable entirely --- starts a standard HTTP server. | For container deployments (Docker, Kubernetes, ECS), either omit `NODE_ENV` or set it to a value other than `production` (e.g. `development`). Only set `production` when deploying to AWS Lambda. See [Serverless](./serverless) for details. |

## Logging

The IDR uses NestJS's built-in logger.
In a container deployment, logs are written to stdout,
making them easy to collect with any log aggregation tool
(CloudWatch, Datadog, ELK, Loki, etc.).

Log messages to watch for:

- **`LINK_HEADER_MAX_SIZE is very large`** --- emitted at startup if the configured limit exceeds 1 MB. Review whether you really need such a high value.
- **`Link header truncated`** --- emitted at request time when optional link entries were dropped to stay within the header size budget.
- **`APP_NAME is not defined`** --- the service will fail to start. Make sure `APP_NAME` is set.

## Next steps

- [Configuration](./configuration) --- adjust environment variables for performance.
- [CI/CD Pipeline](./ci-cd) --- understand how releases and images are produced.
