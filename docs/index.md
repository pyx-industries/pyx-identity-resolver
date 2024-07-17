# Pyx Identity Resolver

The Pyx Identity Resolver is a system designed to manage and resolve links associated with various identifiers, such as GTINs (Global Trade Item Numbers).
It provides a flexible solution for identity registry operators or identifier owners to register and manage links to more information about a product.
This system enables value chain actors to resolve and access this information across different identifier schemes, enhancing traceability and data accessibility throughout the supply chain.

## Core Functionality

- Identifier scheme management (registering and configuring permitted identifier schemes for link registration)
- Link registration and management (allowing registry operators or identifier owners to add and update links to product information)
- Link resolution (enabling value chain actors to access additional information linked to identifiers across various identifier schemes)

## Standards Compliance

- [ISO 18975](https://www.iso.org/standard/85540.html) for link resolution
- [RFC 9264](https://datatracker.ietf.org/doc/html/rfc9264) for link sets
- [GS1 Digital Link](https://ref.gs1.org/standards/digital-link/1.1.3/) for resolving GS1 identifiers

## Access Control

- Anonymous users can resolve link information without authentication
- Authenticated users via API endpoints can:
  - Register and manage identifier schemes
  - Register and manage supported link types for identifier schemes
  - Register and manage links for specific identifiers within permitted identifier schemes

## Documentation

- [Personas](./personas.md)
- [Physical Data Model](./data_models.md)
- [Resolver Description File](./features/resolver_description_file.md)
- [Link Types](./features/link_types.md)
- [Account Management](./features/account_management.md)
- [Identifier Management](./features/identifier_management.md)
- [Link Registration](./features/link_registration.md)
- [Link Resolution](./features/link_resolution.md)
- [Environment Variables](./environment_variables.md)
- [CI](./ci/index.md)

## Contributing

We use [Semantic Line Breaks](https://sembr.org/) in our documentation.
Please follow this convention when contributing to the project.
