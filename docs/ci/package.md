# Package Workflow

## Overview

The Package workflow builds and pushes Docker images for the Identity Resolver application to GitHub Container Registry (GHCR).

## Trigger

This workflow is triggered on:

- Push of tags matching the pattern `*.*.*` (e.g., `1.1.2`)
- Manual trigger via `workflow_dispatch`
- Completion of the `Release` workflow

## Docker Images

The workflow builds two image variants:

| Image Type | Dockerfile | Use Case |
|------------|------------|----------|
| **Standard** | `Dockerfile` | Standard deployment, local development |
| **Serverless** | `Dockerfile.serverless` | AWS Lambda / serverless deployments |

### Multi-Platform Support

Both images are built for multiple architectures:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

### Image Tags

The standard image uses unadorned tags, while the serverless variant uses a `-serverless` suffix:

| Tag Pattern | Example | Description |
|-------------|---------|-------------|
| `{version}` | `1.1.2` | Version-tagged standard image |
| `{version}-serverless` | `1.1.2-serverless` | Version-tagged serverless image |
| `latest` | `latest` | Latest release (standard) |
| `edge` | `edge` | Latest from master (standard) |
| `edge-serverless` | `edge-serverless` | Latest from master (serverless) |
| `sha-{hash}` | `sha-f30ab65` | Commit-specific standard image |
| `sha-{hash}-serverless` | `sha-f30ab65-serverless` | Commit-specific serverless image |

## Pulling Images

### Standard Image (Default)

```bash
# Latest release
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:1.1.2

# Or use latest tag
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:latest

# Latest from master
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:edge
```

### Serverless Image (Lambda Deployment)

```bash
# Latest release
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:1.1.2-serverless

# Latest from master
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:edge-serverless
```

## Workflow Steps

1. **Checkout**: Fetches the repository code
2. **Get version**: Reads version from `version.json` for `workflow_run` triggers
3. **Docker meta (standard)**: Generates tags for standard image
4. **Docker meta (serverless)**: Generates tags with `-serverless` suffix
5. **Set up QEMU**: Enables multi-platform builds
6. **Set up Docker Buildx**: Prepares the Docker buildx environment
7. **Login to GHCR**: Authenticates with GitHub Container Registry
8. **Build and Push Standard Image**: Builds and pushes the standard image
9. **Build and Push Serverless Image**: Builds and pushes the serverless image

## Dependencies

- `actions/checkout@v4`
- `docker/metadata-action@v5`
- `docker/setup-qemu-action@v3`
- `docker/setup-buildx-action@v3`
- `docker/login-action@v3`
- `docker/build-push-action@v5
