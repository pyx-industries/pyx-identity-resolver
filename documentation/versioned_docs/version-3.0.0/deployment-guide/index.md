---
sidebar_position: 1
title: Installation
---

# Installation

This page walks you through getting the Pyx Identity Resolver (IDR) running
in a production-like environment using Docker.
If you just want to explore the API locally,
the [Development Setup](../contributing/index.md) guide is a faster path.

:::info New to the IDR?
If you haven't used the service before,
start with [Understanding the Service](../understanding-the-service/)
for a conceptual overview of what the IDR does
and how identifiers, links, and resolution fit together.
:::

## Prerequisites

| Requirement | Minimum version |
|-------------|-----------------|
| [Docker](https://docs.docker.com/get-docker/) | 20.10+ |
| [Docker Compose](https://docs.docker.com/compose/install/) | 2.0+ (included with Docker Desktop) |

That's it --- the IDR ships as a container image,
so you don't need Node.js or any other runtime on the host.

## Quick start with Docker Compose

The fastest way to stand up the IDR and its MinIO object store together
is to use the `docker-compose.yaml` included in the repository:

```bash
git clone https://github.com/pyx-industries/pyx-identity-resolver.git
cd pyx-identity-resolver
docker compose up -d
```

This starts two services:

| Service | Description | Default port |
|---------|-------------|-------------|
| `identity-resolver` | The IDR REST API | `3000` |
| `minio` | S3-compatible object store | `9000` (API), `9090` (console) |

## Using pre-built images from GHCR

If you'd rather skip building from source,
grab a pre-built image from the
[GitHub Container Registry](https://github.com/pyx-industries/pyx-identity-resolver/pkgs/container/pyx-identity-resolver).

Two image variants are published for every release:

| Image | Tag example | Use case |
|-------|-------------|----------|
| Standard | `2.0.0` | Docker, Docker Compose, Kubernetes |
| Serverless | `2.0.0-serverless` | AWS Lambda container deployments |

Both variants are built for **linux/amd64** and **linux/arm64**,
so they work on Intel/AMD servers and ARM-based hosts (Graviton, Apple Silicon under emulation, etc.).

### Pulling an image

```bash
# Standard image
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:2.0.0

# Serverless image (AWS Lambda)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:2.0.0-serverless
```

### Tag format

| Tag pattern | Meaning |
|-------------|---------|
| `X.Y.Z` | Specific release (recommended for production) |
| `X.Y.Z-serverless` | Serverless variant of a specific release |
| `edge` | Latest build from the `master` branch |
| `sha-<commit>` | Build pinned to an exact commit |

:::tip
Pin to a specific version tag (e.g. `2.0.0`) in production
rather than `edge` or `latest` to avoid unexpected changes.
:::

### Running the pre-built image

Create an `.env` file with your configuration
(see [Configuration](./configuration) for the full variable reference):

```env
OBJECT_STORAGE_ENDPOINT=your-minio-host
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
OBJECT_STORAGE_ACCESS_KEY=minioadmin
OBJECT_STORAGE_SECRET_KEY=minioadmin
OBJECT_STORAGE_BUCKET_NAME=idr-bucket
OBJECT_STORAGE_PATH_STYLE=true
IDENTIFIER_PATH=identifiers
API_KEY=your-secret-key
RESOLVER_DOMAIN=https://resolver.example.com/api/3.0.0
APP_NAME=IDR
PORT=3000
```

Then run the container with the env file:

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/pyx-industries/pyx-identity-resolver:2.0.0
```

:::warning NODE_ENV and the serverless code path
Do **not** set `NODE_ENV=production` for standard container deployments.
When `NODE_ENV` is `production`,
the IDR bootstraps in serverless mode (AWS Lambda handler)
instead of starting a standard HTTP server.
Omit `NODE_ENV` entirely or set it to any other value
(e.g. `development`, `test`) for Docker-based deployments.
See [Serverless](./serverless) for details.
:::

You'll still need an S3-compatible object store accessible to the container.
See [Storage Providers](./storage-providers) for setup options.

## Verify it's running

Once the container is up,
open the Swagger UI at the `/api-docs` path on your configured host and port.
For example, if you mapped port `3000` locally:

```
http://<your-host>:3000/api-docs
```

You should see the interactive API documentation.
Click **Authorize** and enter your `API_KEY` value to start making authenticated requests.

You can also do a quick health check from the command line:

```bash
curl -s http://<your-host>:3000/api-docs | head -c 100
```

If you see HTML content, the service is up and serving requests.

## Next steps

- [Configuration](./configuration) --- fine-tune environment variables for your deployment.
- [Storage Providers](./storage-providers) --- choose between MinIO and AWS S3.
- [Serverless](./serverless) --- deploy to AWS Lambda.
- [Scaling](./scaling) --- guidance for running the IDR at scale.
