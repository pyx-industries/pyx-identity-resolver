# Pyx Identity Resolver

This software offers a flexible solution for managing and resolving links associated with various identifiers like GTINs (Global Trade Item Numbers). 

It enables identity registry operators and identifier owners to register links to more information about a product, while allowing value chain actors to resolve and access information linked to these identifiers across various identifier schemes, enhancing traceability and data accessibility.

## Core Functionality

* Identifier scheme management (registering and configuring permitted identifier schemes for link registration)
* Link registration and management (allowing registry operators or identifier owners to add and update links to product information)
* Link resolution (enabling value chain actors to access additional information linked to identifiers across various identifier schemes)

## Standards Compliance

* [ISO 18975](https://www.iso.org/standard/85540.html) for link resolution
* [RFC 9264](https://datatracker.ietf.org/doc/html/rfc9264) for link sets
* [GS1 Digital Link](https://ref.gs1.org/standards/digital-link/1.1.3/) for resolving GS1 identifiers

## Access Control

* Anonymous users can resolve link information without authentication
* Authenticated users via API endpoints can:
    * Register and manage identifier schemes
    * Register and manage supported link types for identifier schemes
    * Register and manage links for specific identifiers within permitted identifier schemes

## Quick Start

To quickly set up and run the Identity Resolver using the docker-compose.yaml file, execute the following command:

```bash
docker compose up -d
```

For more detailed setup and configuration options, refer to the [documentation site](https://pyx-industries.github.io/pyx-identity-resolver/).

## Docker Images

Pre-built Docker images are available on [GitHub Container Registry](https://github.com/pyx-industries/pyx-identity-resolver/pkgs/container/pyx-identity-resolver). Two variants are provided:

| Image | Use Case |
|-------|----------|
| Default (no suffix) | Standard deployment, local development |
| `-serverless` | AWS Lambda / serverless deployments |

Both images support `linux/amd64` and `linux/arm64` architectures.

### Pulling Images

```bash
# Standard image (default)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:1.1.2

# Serverless image (Lambda deployment)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:1.1.2-serverless
```

For more details on available tags, see the [Package workflow documentation](./docs/ci/package.md).

## Contributing

We use [Semantic Line Breaks](https://sembr.org/) in our documentation. Please follow this convention when contributing to the project.

## Release and Publishing

This project uses two primary workflows:

1. [Release](./.github/workflows/release.yml): Creates version tags and GitHub releases when merging to `master`.
2. [Package](./.github/workflows/package.yml): Builds and pushes Docker images to the GitHub Container Registry.

We follow [Semantic Versioning](https://semver.org/) with the format `MAJOR.MINOR.PATCH`.

For more detailed information, please refer to the [Release Guide](./RELEASE_GUIDE.md) and [Release Management Guide](./RELEASE_MANAGEMENT_GUIDE.md).

### Quick Release Guide

1. Create a `release/*` branch from `master` (e.g., `release/1.2.0`).
2. Update version in `app/package.json` and `version.json`.
3. If documentation changed, generate new version: `cd documentation && yarn release:doc`.
4. Merge the auto-generated changelog PR into the release branch.
5. Create a PR from the release branch to `master`.
6. Merge the PR - the release pipeline will automatically create tags and GitHub releases.

The `version.json` file contains version metadata:

```json
{
  "version": "MAJOR.MINOR.PATCH",
  "apiVersion": "MAJOR.MINOR.PATCH",
  "docVersion": "MAJOR.MINOR.PATCH",
  "dependencies": {}
}
```

- `version`: Always update to match the release version.
- `apiVersion`: Only update if the API contract changes.
- `docVersion`: Only update if documentation changed.
