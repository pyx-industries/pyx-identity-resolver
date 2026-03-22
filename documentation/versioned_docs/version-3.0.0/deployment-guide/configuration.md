---
sidebar_position: 2
title: Configuration
---

# Configuration

The IDR is configured entirely through environment variables.
In a Docker or container orchestrator deployment
you pass these variables via `docker run -e`, a `docker-compose.yaml` `environment` block,
or your platform's secrets/config mechanism.

This page covers the variables you'll care about in production.
For the full developer-oriented configuration
(including `.env` file override mechanics),
see the [Development Setup](../contributing/index.md) page.

## Core variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Set to `production` for serverless (Lambda) deployments. In non-production modes the app starts a standard HTTP server. |
| `RESOLVER_DOMAIN` | **Yes** | --- | The public base URL of your resolver, including the API version path. Example: `https://resolver.example.com/api/3.0.0` |
| `PORT` | No | `3000` | The port the HTTP server listens on. Only used when `NODE_ENV` is **not** `production`. |
| `APP_NAME` | **Yes** | --- | A short name for your resolver instance (e.g. `IDR`). Used in API responses and health checks. The app will fail to start if this is empty. |
| `API_KEY` | **Yes** | --- | Bearer token required for all authenticated endpoints (identifier management, link registration). Anonymous link resolution does not require a key. |
| `LINK_TYPE_VOC_DOMAIN` | No | Derived at runtime | Base URL for the link type vocabulary endpoint. At runtime the IDR uses the identifier's `namespaceURI` first; if that is empty it falls back to `{RESOLVER_DOMAIN}/voc`. You only need to set this variable explicitly if you host your vocabulary at a different domain. |
| `LINK_HEADER_MAX_SIZE` | No | `8192` | Maximum size in bytes of the `Link` response header. Must be a positive integer. If the assembled header exceeds this limit, optional entries are dropped to stay within budget. Recommended maximum: `65536` (64 KB). |
| `API_BASE_URL` | No | `http://localhost:3000` | Base URL used by the Swagger UI server definition. Set this to your public URL so the "Try it out" feature in Swagger works correctly. |

### `RESOLVER_DOMAIN` explained

This variable tells the IDR how to construct canonical URIs
that appear in linksets and response headers.
It **must** include the API version path segment.

```
https://resolver.example.com/api/3.0.0
```

If you're running behind a reverse proxy or load balancer,
set this to the externally reachable URL --- not the internal container address.

### Access control

The `API_KEY` variable protects write operations
(registering identifier schemes, managing link types, registering links).
Read-only link resolution is always anonymous.
For a conceptual overview of how registration and resolution differ,
see [Understanding the Service](../understanding-the-service/).

In production you should:

1. **Change the key** from the default `test123` to a strong, random value.
2. **Rotate the key** periodically --- a restart is required to pick up the new value.
3. **Keep it out of version control** --- pass it through your platform's secrets manager
   (AWS Secrets Manager, Vault, Docker secrets, etc.).

:::warning
The default API key in the bundled `docker-compose.yaml` is `test123`.
**Never** use this value in production.
Generate a strong, random key and pass it through your platform's secrets manager.
:::

Requests to protected endpoints must include the key as a Bearer token:

```
Authorization: Bearer your-secret-key
```

## Object storage variables

These variables configure the connection to your S3-compatible object store.
For detailed guidance on choosing and configuring a storage provider,
see [Storage Providers](./storage-providers).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OBJECT_STORAGE_ENDPOINT` | **Yes** | --- | Hostname or IP of the object storage service (e.g. `minio`, `s3.amazonaws.com`). |
| `OBJECT_STORAGE_PORT` | **Yes** | --- | Port number for the storage service (e.g. `9000` for MinIO, `443` for AWS S3). |
| `OBJECT_STORAGE_USE_SSL` | No | `false` | Set to `true` for TLS-encrypted connections. **Always use `true` in production** unless you have a TLS-terminating proxy in front of the storage service. |
| `OBJECT_STORAGE_ACCESS_KEY` | **Yes** | --- | Access key (or AWS access key ID) for authentication. |
| `OBJECT_STORAGE_SECRET_KEY` | **Yes** | --- | Secret key (or AWS secret access key) for authentication. |
| `OBJECT_STORAGE_BUCKET_NAME` | **Yes** | --- | Name of the bucket where the IDR stores its data (e.g. `idr-bucket`). The IDR creates the bucket automatically on startup if it doesn't already exist. |
| `OBJECT_STORAGE_PATH_STYLE` | No | `true` | Use path-style requests (`true`) or virtual-hosted-style (`false`). Set to `true` for MinIO; set to `false` for AWS S3 and most cloud providers. |
| `OBJECT_STORAGE_REGION` | No | --- | AWS region for the bucket (e.g. `ap-southeast-2`). Only required for AWS S3 or region-aware S3-compatible services. |

## Other variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `IDENTIFIER_PATH` | No | `identifiers` | The path prefix used when storing identifier-related data in object storage. You rarely need to change this. |

## Operational notes

### What happens if object storage is unreachable?

The IDR depends on its object store for all persistent data.
If the storage endpoint is unreachable:

- **Link resolution** requests will fail with a `500` error
  because the IDR cannot retrieve linkset data.
- **Write operations** (identifier and link registration) will also fail.
- The IDR process itself will remain running and continue accepting connections,
  so a transient storage outage will self-heal once connectivity is restored.

Make sure your storage endpoint is reachable from the IDR container
and that credentials are correct before you start serving traffic.

### Sensible defaults for getting started

If you're evaluating the IDR and want a minimal configuration to get running,
here's the smallest set of variables you need beyond what `docker-compose.yaml` already provides:

| Variable | Suggested value |
|----------|-----------------|
| `RESOLVER_DOMAIN` | `https://resolver.example.com/api/3.0.0` (use your actual host) |
| `APP_NAME` | `IDR` |
| `API_KEY` | Any non-empty string (change for production!) |
| `OBJECT_STORAGE_ENDPOINT` | `minio` (if using the bundled MinIO) |
| `OBJECT_STORAGE_ACCESS_KEY` | `minioadmin` |
| `OBJECT_STORAGE_SECRET_KEY` | `minioadmin` |
| `OBJECT_STORAGE_BUCKET_NAME` | `idr-bucket` |

:::tip
The bundled `docker-compose.yaml` ships with working defaults for all of these,
so `docker compose up` works out of the box for local evaluation.
Adjust `RESOLVER_DOMAIN` to your actual public URL before serving real traffic.
:::

Everything else has a workable default for local use.

## Next steps

- [Storage Providers](./storage-providers) --- detailed setup for MinIO and AWS S3.
- [Serverless](./serverless) --- configuration differences for Lambda deployments.
