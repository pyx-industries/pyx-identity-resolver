---
sidebar_position: 6
title: Resolver Description File
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Resolver Description File

The resolver description file provides information about the identity resolver service. It can be accessed via a GET request to the `/.well-known/resolver` endpoint.

## Endpoint

GET `/.well-known/resolver`

## Response Format

The response is a JSON object with the following structure:

```json
{
  "name": string,
  "resolverRoot": string,
  "supportedLinkType": Array<SupportedLinkType>,
  "supportedPrimaryKeys": Array<string>
}
```

Where `SupportedLinkType` is an object with the following structure:

```json
{
  "namespace": string,
  "prefix": string,
  "profile": string
}
```

## Fields

- `name`: The name of the identity resolver service.
- `resolverRoot`: The base URL of the resolver service.
- `supportedLinkType`: An array of supported link types.
- `supportedPrimaryKeys`: An array of supported primary keys (currently always `["all"]`).

For each supported link type:

- `namespace`: The URI of the namespace.
- `prefix`: The prefix used for the namespace.
- `profile`: The URL where the link type profile can be found.

## Example

```bash
curl -X GET http://localhost:3000/api/1.0.0/.well-known/resolver
```

Example response:

```json
{
  "name": "The IDR",
  "resolverRoot": "http://localhost:3000/api/1.0.0",
  "supportedLinkType": [
    {
      "namespace": "http://gs1.org/voc/",
      "prefix": "gs1:",
      "profile": "https://www.gs1.org/voc/?show=linktypes"
    },
    {
      "namespace": "http://localhost:3000/api/1.0.0/voc/",
      "prefix": "local:",
      "profile": "http://localhost:3000/api/1.0.0/voc/?show=linktypes"
    }
  ],
  "supportedPrimaryKeys": ["all"]
}
```

## Additional Information

- The `name` is derived from the `APP_NAME` environment variable.
- The `resolverRoot` is derived from the `RESOLVER_DOMAIN` environment variable.
- The `supportedLinkType` array is generated based on the identifiers registered in the system.
- If an identifier doesn't have a specified `namespaceURI` or `namespaceProfile`, the default link types are used `http://localhost:3000/api/1.0.0/voc/`.

### Link Types

The default link types are defined in a file within the codebase. These default link types are based on the GS1 link types, which are widely used in industry. You can view all available link types by making a GET request to `/api/1.0.0/voc?show=linktypes`.

```bash
curl -X GET http://localhost:3000/api/1.0.0/voc?show=linktypes
```

This will return a JSON object containing all available link types configured in the IDR and their descriptions.

To get details about a specific link type, you can make a GET request to `/api/1.0.0/voc/{linktype}`:

```bash
curl -X GET http://localhost:3000/api/1.0.0/voc/productSustainabilityInfo
```

This will return a JSON object with details about the specified link type, for example:

```json
{
  "title": "sustainability and recycling",
  "description": "Information about the products sustainability of manufacture, recycling information etc."
}
```

### Custom Link Types

The IDR allows operators to create and expose their own custom link types. This feature enables other registry operators to resolve these custom link types, promoting interoperability and extensibility.

To add or modify link types:

1. Custom link types need to be added or modified in the codebase.
2. The new or modified link types should be included in the `defaultLinkTypes` object within the `app/src/modules/common/data/default-link-types.ts` file.
3. After modifying the codebase, the IDR needs to be rebuilt and redeployed for the changes to take effect.

It's important to note that while the default link types are based on GS1 standards, IDR operators have the flexibility to extend or replace this set with their own custom link types. This allows for adaptation to specific industry needs or unique use cases.
