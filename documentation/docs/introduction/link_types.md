---
sidebar_position: 5
title: Link Types
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Link Types

Link types play a crucial role in the Identity Digital Resolver (IDR) service by defining the nature and purpose of the links associated with identifiers. They provide a standardised way to categorise and describe the relationships between identifiers and their related resources.

## Role of Link Types

1. **Categorisation**: Link types categorise the nature of the relationship between an identifier and a linked resource. For example, a link type might indicate that a URL leads to product information, safety data, or a promotional page.

2. **Interoperability**: By using standardised link types, different systems can understand and process links consistently, enabling seamless data exchange and integration.

3. **Flexibility**: While the IDR provides a default set of link types based on GS1 standards, it also allows for custom link types, enabling adaptation to specific industry needs or unique use cases.

4. **Discoverability**: Link types make it easier for clients to discover and utilise relevant information associated with an identifier.

## Where Link Types Are Used in the System

Link types are utilised in several key areas of the IDR system:

1. **Link Registration**: When registering a new link, the link type is specified as part of the registration payload. This defines the nature of the relationship between the identifier and the linked resource.

2. **Link Resolution**: During the link resolution process, link types are used to filter and retrieve the appropriate links based on the client's request.

3. **Response Construction**: When constructing the response to a resolution request, link types are used to organise and present the relevant links in both the linkset JSON and the link header text.

## IDR Expectations for Link Types

When using link types in the IDR service, whether they are default or custom, the following expectations should be met:

1. **Unique Identification**: Each link type should have a unique identifier. E.g. `productInfo`.

2. **Clear Definition**: Each link type should have a clear, concise definition that describes its purpose and the nature of the relationship it represents.

3. **Vocabulary Documentation**: When using external link type vocabularies, descriptive documentation should be available at the URL specified in the `profile` field of the `SupportedLinkType` object.

4. **Resolvability**: The `namespace` URL in the `SupportedLinkType` object should ideally resolve to a human-readable description of the link type vocabulary and must resolve to a machine-readable format (JSON).

## Using External Link Type Vocabularies

When using external link type vocabularies for an identifier scheme within the IDR service, the following guidelines should be followed:

1. **Namespace Declaration**: The URI of the namespace vocabulary of the identifier scheme should be declared using the `"namespaceURI"` field when registering the identifier scheme within the identity resolver service. E.g. `"namespaceURI": "http://localhost:3000/api/1.0.0/voc/"`.

2. **Profile URL**: The profile URL should point to a resource that describes the link types in the vocabulary, in a machine-readable format (JSON). E.g. `"profileUrl": "http://localhost:3000/api/1.0.0/voc/?show=linktypes"`.
