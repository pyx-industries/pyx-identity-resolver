---
sidebar_position: 4
title: Serverless
---

# Serverless

The IDR ships a dedicated **serverless Docker image**
designed for deployment on AWS Lambda using
[container image support](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html).
This lets you run the full IDR without managing servers,
paying only for the requests you serve.

## When to use serverless

A serverless deployment works well when:

- Your traffic is **low or spiky** ---
  you don't want to pay for idle compute.
- You want **zero server management** ---
  AWS handles patching, scaling, and availability.
- You're already invested in the **AWS ecosystem**
  and want to keep everything under one roof.

If you have sustained, high-throughput traffic,
a standard container deployment
(see [Installation](./index.md)) is likely more cost-effective.

## The serverless image

The serverless variant is built from `Dockerfile.serverless`,
which uses the official AWS Lambda Node.js 22 base image:

```
FROM public.ecr.aws/lambda/nodejs:22
```

Key differences from the standard image:

| Aspect | Standard image | Serverless image |
|--------|---------------|-----------------|
| Base image | `node:22-alpine` | `public.ecr.aws/lambda/nodejs:22` |
| Entry point | `node dist/main` | Lambda runtime invokes `dist/main.handler` |
| `NODE_ENV` | Typically `development` | Must be `production` |
| Port binding | Listens on `PORT` | Not applicable (Lambda manages networking) |
| `OBJECT_STORAGE_PATH_STYLE` | `true` (MinIO default) | `false` (AWS S3 default) |

### Pulling the serverless image

```bash
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:3.0.0-serverless
```

The image is built for both `linux/amd64` and `linux/arm64`,
so you can choose Graviton-based Lambda functions for better price-performance.

## Configuration differences

When `NODE_ENV` is set to `production`,
the IDR bootstraps differently:

1. Instead of binding to a port, it initialises the NestJS application
   and wraps it with
   [`@codegenie/serverless-express`](https://github.com/CodeGenieApp/serverless-express),
   which adapts API Gateway/ALB events into Express-compatible requests.
2. The Lambda handler is exported as `handler` from `dist/main`.
3. After the first cold start,
   the NestJS application is cached and reused for subsequent invocations.

### Required environment variables

:::warning
`NODE_ENV=production` is the **only** value that triggers the serverless bootstrap path.
Any other value --- including omitting the variable entirely ---
causes the IDR to start a standard HTTP server.
Do not set `NODE_ENV=production` for Docker or Kubernetes deployments.
:::

All the same [Configuration](./configuration) variables apply,
with these adjustments:

| Variable | Value | Why |
|----------|-------|-----|
| `NODE_ENV` | `production` | **Required** --- this is what triggers the serverless bootstrap path. |
| `OBJECT_STORAGE_PATH_STYLE` | `false` | You'll almost certainly be using AWS S3, which uses virtual-hosted-style requests. |
| `OBJECT_STORAGE_USE_SSL` | `true` | Always use TLS when talking to S3 from Lambda. |
| `OBJECT_STORAGE_ENDPOINT` | `s3.amazonaws.com` | Or the regional endpoint for your bucket. |
| `OBJECT_STORAGE_REGION` | e.g. `ap-southeast-2` | Must match your S3 bucket's region. |
| `PORT` | _(not needed)_ | Lambda manages networking; this variable is ignored. |

## Lambda setup

### Creating the function

1. In the AWS Console, create a new Lambda function
   and choose **Container image** as the deployment method.
2. Point it at your GHCR image
   (you may need to copy it to Amazon ECR first,
   as Lambda can only pull from ECR or public ECR).
3. Set the **handler** to the image's default CMD: `dist/main.handler`.

### Recommended settings

| Setting | Recommended value | Notes |
|---------|-------------------|-------|
| Memory | 512 MB -- 1024 MB | More memory also means more CPU. Start at 512 MB and adjust based on response times. |
| Timeout | 30 seconds | The IDR responds quickly for resolution, but registration endpoints that write to S3 may take longer on first call. |
| Architecture | `arm64` | Graviton offers better price-performance. The serverless image supports both `amd64` and `arm64`. |

### API Gateway integration

You'll need an API Gateway (HTTP API or REST API) in front of the Lambda function
to expose it over HTTPS.
Configure a **proxy integration** that forwards all paths to the Lambda:

- Route: `/{proxy+}`
- Method: `ANY`
- Integration: Lambda function

The `@codegenie/serverless-express` adapter handles path mapping internally,
so the IDR's routes work as expected behind the proxy.

## Limitations

### Cold starts

The first invocation after a period of inactivity
triggers a **cold start** where the NestJS application bootstraps from scratch.
This typically adds 1--3 seconds of latency.
Subsequent requests reuse the cached application instance and respond much faster.

To mitigate cold starts:

- **Provisioned concurrency** --- keeps a set number of instances warm.
  This adds cost but eliminates cold-start latency.
- **Increase memory** --- higher memory allocations
  give the function more CPU, which speeds up initialisation.

### Swagger UI

The Swagger documentation UI is still available at `/api-docs`,
but in a serverless environment it's mainly useful for development and testing.
Consider disabling or restricting access to it in production
through API Gateway resource policies.

### No WebSocket support

The serverless adapter translates HTTP request/response events.
WebSocket or long-lived connections are not supported in this deployment model.

## Next steps

- [Configuration](./configuration) --- full environment variable reference.
- [CI/CD Pipeline](./ci-cd) --- how the serverless image is built and published.
