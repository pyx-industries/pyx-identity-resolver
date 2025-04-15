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

## Contributing

We use [Semantic Line Breaks](https://sembr.org/) in our documentation. Please follow this convention when contributing to the project.

## Release and Publishing

This project uses two primary workflows:

1. [Release Tagging](./.github/workflows/release-tagging.yml): Creates version tags based on `app/package.json`.
2. [Package](./.github/workflows/package.yml): Builds and pushes Docker images to the GitHub Container Registry.

We follow [Semantic Versioning](https://semver.org/) with the format `vMAJOR.MINOR.PATCH`.

For more detailed information, please refer to the [documentation](docs/index.md).

### Release Guide

To release a new version, ensure we have the `version.json` file updated with the new version number. Then, create a new release tag with the following steps:

1. Create a new release branch from `next` with the version number as the branch name.
2. Update the `version.json` file with the new version number.
3. Generate new documentation version using the release script

```bash
cd documentation
yarn release:doc
```

4. Check API documentation and update if necessary.
5. Commit the changes and push the branch.
6. Create a pull request from the release branch to `main`.
7. Merge the pull request.
8. Create a new release tag with the version number.
9. Push the tag to the repository.

(\*) With the `version.json` file, it contains the version number in the following format:

```json
{
  "version": "MAJOR.MINOR.PATCH",
  "apiVersion": "MAJOR.MINOR.PATCH",
  "docVersion": "MAJOR.MINOR.PATCH",
  "dependencies": {}
}
```

We need to change manually the `version`, `apiVersion`, and `docVersion` fields.
