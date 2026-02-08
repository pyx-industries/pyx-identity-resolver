---
sidebar_position: 3
title: Storage Providers
---

# Storage Providers

The IDR stores all its persistent data --- identifier schemes, link registrations,
and pre-built linkset JSON files --- in an S3-compatible object store.
It does **not** use a traditional database.

This design keeps the service stateless and easy to scale,
because the only thing you need to back up and manage is a single storage bucket.

## How the IDR uses object storage

Under the hood the IDR uses the
[MinIO JavaScript Client SDK](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html),
which speaks the standard **S3 API**.
This means any storage service that implements the S3 interface will work:

- [MinIO](https://min.io/) (self-hosted)
- [AWS S3](https://aws.amazon.com/s3/)
- [Google Cloud Storage](https://cloud.google.com/storage) (with S3 compatibility mode)
- [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

The IDR reads and writes JSON files to a single bucket.
The bucket must be created **before** the IDR starts ---
the service does not create it automatically.

## MinIO

[MinIO](https://min.io/) is an open-source, high-performance object store
that you can run alongside the IDR on the same host or cluster.
It's the default storage provider in the project's `docker-compose.yaml`
and is ideal for:

- Local development and testing
- Self-hosted deployments where you want full control over your data
- Air-gapped or on-premises environments

### Example environment variables

```bash
OBJECT_STORAGE_ENDPOINT=minio          # Hostname of the MinIO service
OBJECT_STORAGE_PORT=9000               # MinIO API port
OBJECT_STORAGE_USE_SSL=false           # true if you've configured TLS on MinIO
OBJECT_STORAGE_ACCESS_KEY=minioadmin   # MinIO root user
OBJECT_STORAGE_SECRET_KEY=minioadmin   # MinIO root password
OBJECT_STORAGE_BUCKET_NAME=idr-bucket  # Bucket name (create it first)
OBJECT_STORAGE_PATH_STYLE=true         # Must be true for MinIO
```

:::caution
The default MinIO credentials (`minioadmin` / `minioadmin`) are **not suitable for production**.
Change them to strong, unique values and restrict network access to the MinIO API port.
:::

### Docker Compose example

The repository's `docker-compose.yaml` already includes a MinIO service.
Here's a trimmed version showing the relevant parts:

```yaml
services:
  identity-resolver:
    image: ghcr.io/pyx-industries/pyx-identity-resolver:1.1.3
    ports:
      - '3000:3000'
    environment:
      - OBJECT_STORAGE_ENDPOINT=minio
      - OBJECT_STORAGE_PORT=9000
      - OBJECT_STORAGE_USE_SSL=false
      - OBJECT_STORAGE_ACCESS_KEY=minioadmin
      - OBJECT_STORAGE_SECRET_KEY=minioadmin
      - OBJECT_STORAGE_BUCKET_NAME=idr-bucket
      - OBJECT_STORAGE_PATH_STYLE=true
      - IDENTIFIER_PATH=identifiers
      - API_KEY=change-me-in-production
      - RESOLVER_DOMAIN=https://resolver.example.com/api/1.0.0
      - APP_NAME=IDR
      - PORT=3000
    depends_on:
      - minio

  minio:
    image: quay.io/minio/minio:RELEASE.2024-08-17T01-24-54Z-cpuv1
    command: server /data --console-address ":9090"
    ports:
      - '9000:9000'   # S3 API
      - '9090:9090'   # Web console
    environment:
      - OBJECT_STORAGE_ROOT_USER=minioadmin
      - OBJECT_STORAGE_ROOT_PASSWORD=minioadmin
    volumes:
      - ./object_storage_data:/data
```

:::info MinIO environment variables
The MinIO container expects `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`
as its native credential variables.
The `docker-compose.yaml` in this repository uses `OBJECT_STORAGE_ROOT_USER`
and `OBJECT_STORAGE_ROOT_PASSWORD` instead,
which MinIO also accepts as aliases.
If you write your own Compose file or run MinIO outside of Docker Compose,
use the canonical `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` names.
:::

:::tip Full Compose file
The example above is trimmed for readability.
The full `docker-compose.yaml` in the repository also includes
a `hostname` setting and a `healthcheck` block on the MinIO service
to ensure the storage API is ready before the IDR starts.
Refer to the repository's `docker-compose.yaml` for the complete configuration.
:::

### Bucket creation

The IDR automatically creates the configured bucket on startup
if it doesn't already exist.
You don't need to create it manually.

## AWS S3

AWS S3 is a natural choice
when you're already running infrastructure on AWS
or need a fully managed, highly durable storage backend.

### Example environment variables

```bash
OBJECT_STORAGE_ENDPOINT=s3.amazonaws.com          # Or regional: s3.ap-southeast-2.amazonaws.com
OBJECT_STORAGE_PORT=443                            # HTTPS
OBJECT_STORAGE_USE_SSL=true                        # Always true for AWS S3
OBJECT_STORAGE_ACCESS_KEY=AKIA...                  # IAM access key ID
OBJECT_STORAGE_SECRET_KEY=wJalr...                 # IAM secret access key
OBJECT_STORAGE_BUCKET_NAME=my-idr-bucket           # Your S3 bucket name
OBJECT_STORAGE_PATH_STYLE=false                    # AWS S3 uses virtual-hosted-style
OBJECT_STORAGE_REGION=ap-southeast-2               # Your bucket's region
```

### Key differences from MinIO

| Setting | MinIO | AWS S3 |
|---------|-------|--------|
| `OBJECT_STORAGE_PATH_STYLE` | `true` | `false` |
| `OBJECT_STORAGE_USE_SSL` | Usually `false` (local) | `true` |
| `OBJECT_STORAGE_PORT` | `9000` | `443` |
| `OBJECT_STORAGE_REGION` | Not required | Required |

### Bucket setup guidance

:::info
The IDR automatically creates the configured bucket on startup
if it doesn't already exist.
For AWS S3, you may still prefer to create the bucket yourself
so you can configure versioning, access policies, and region settings upfront.
:::

1. **Enable versioning** if you want the ability
   to recover from accidental overwrites --- this is optional
   but recommended for production.
3. **Block public access** --- the IDR connects to S3 using IAM credentials,
   so the bucket does not need to be publicly accessible.
4. **IAM permissions** --- the IAM user or role
   associated with the access key needs the following actions on the bucket:
   - `s3:GetObject`
   - `s3:PutObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`
   - `s3:CreateBucket` (only needed if the IDR creates the bucket on startup)

A minimal IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::my-idr-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:CreateBucket"
      ],
      "Resource": "arn:aws:s3:::my-idr-bucket"
    }
  ]
}
```

## Other S3-compatible providers

Because the IDR uses the standard S3 protocol,
you can point it at any compatible provider.
The configuration follows the same pattern as AWS S3 ---
just adjust the endpoint, port, and path-style settings
to match your provider's documentation.

For example, with **Cloudflare R2**:

```bash
OBJECT_STORAGE_ENDPOINT=<account-id>.r2.cloudflarestorage.com
OBJECT_STORAGE_PORT=443
OBJECT_STORAGE_USE_SSL=true
OBJECT_STORAGE_PATH_STYLE=false
OBJECT_STORAGE_REGION=auto
```

## Next steps

- [Configuration](./configuration) --- full reference for all environment variables.
- [Scaling](./scaling) --- storage considerations as your deployment grows.
