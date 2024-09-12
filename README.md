# Pyx Llink Resolver

This software enables users to resolve identifiers
and retrieve relevant information
associated with those identifiers.

The core functionality includes link resolution,
identifier management, and basic link registration.

This software complies with:

* complies with ISO 18975 for link resolution
* supports the GS1 Digital Link standard for resolving GS1 identifiers.

It allows anonymous users to access the service
and retrieve link information without authentication.

Authorised users have the ability to register and manage links
associated with identifiers through an authenticated API endpoint.

More detailed documentation is in the [document folder](docs/index.md)


## Developers

The system can be run locally using docker-compose
(see `docker-compose.yml`, or run `docker-compose up`)

Notes:
* Use [Semantic Line Breaks](https://sembr.org/) for text markup

## Release and Publishing

This project utilizes two primary workflows to manage the release and publishing process: [Release Tagging](./.github/workflows/release-tagging.yml) and [Package](./.github/workflows/package.yml).

### Release Tagging Workflow

The [Release Tagging](./.github/workflows/release-tagging.yml) workflow file is responsible for creating version tags based on the version specified in the [package.json](./app/package.json) file. When a push is made to the master branch, this workflow checks the version, creates a corresponding tag, and pushes it to the repository. If the tag already exists, the workflow skips creating a new tag.

The version number is incremented based on the following rules: `vMAJOR`.`MINOR`.`PATCH`

Examples: v0.0.1 -> v0.0.2 -> v0.1.0 -> v1.0.0 -> v1.0.1 -> v1.1.0 -> v2.0.0


### Package Workflow

The [Package](./.github/workflows/package.yml) workflow is triggered automatically after the [Release Tagging](./.github/workflows/release-tagging.yml) workflow completes or when a version tag is manually created. This workflow builds and pushes a Docker image to the GitHub Container Registry. The image is tagged with the appropriate version, ensuring that the versioning in your Docker images aligns with the application's version in the codebase.

By automating these processes, we ensure consistent versioning and efficient deployment of the application.
