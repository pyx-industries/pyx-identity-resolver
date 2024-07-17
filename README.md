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

To get the Identity Resolver up and running quickly, follow the [Quick Start Guide](./app/README.md).


## Contributing

We use [Semantic Line Breaks](https://sembr.org/) in our documentation. Please follow this convention when contributing to the project.

## Release and Publishing

This project uses two primary workflows:

1. [Release Tagging](./.github/workflows/release-tagging.yml): Creates version tags based on `app/package.json`.
2. [Package](./.github/workflows/package.yml): Builds and pushes Docker images to the GitHub Container Registry.

We follow [Semantic Versioning](https://semver.org/) with the format `vMAJOR.MINOR.PATCH`.

For more detailed information, please refer to the [documentation](docs/index.md).