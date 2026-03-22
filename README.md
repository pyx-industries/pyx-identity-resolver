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
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:3.0.0

# Serverless image (Lambda deployment)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:3.0.0-serverless
```

For more details on available tags, see the [CI/CD Pipeline](https://pyx-industries.github.io/pyx-identity-resolver/docs/deployment-guide/ci-cd) page on the documentation site.

## Contributing

We use [Semantic Line Breaks](https://sembr.org/) in our documentation. Please follow this convention when contributing to the project.

## Release and Publishing

We follow [Semantic Versioning](https://semver.org/) with the format `MAJOR.MINOR.PATCH`.

For the full release process, refer to the [Release Process](https://pyx-industries.github.io/pyx-identity-resolver/docs/contributing/release-process) page on the documentation site.
