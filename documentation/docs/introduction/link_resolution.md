---
sidebar_position: 8
title: Link resolution
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Link resolution

Link resolution is generally a three-step process

1. The first step is to construct an [ISO 18975](https://www.iso.org/standard/85540.html) conforming URL
   from a given entity/facility/product identifier.
   This step can be skipped if the identifier is already
   a identity resolver URL such as a QR code.
2. The second step if to request link information
   from the identity resolver for the given entity/facility/product.
   The identity resolver will typically return a list of link types
   that indicate locations of further information.
   The returned links may point to further identity resolvers
   or other external locations.
3. The final step is to follow one or more of the retrieved links
   to obtain the specific information for that link type
   (eg a digital product passport).
   Some types of links (or further information)
   MAY require authorisation for secure data access.

These steps may be merged into a single query
when the required link type is already known.
So, rather than "tell me what you have,
then I'll choose the link I want",
the single query is more like "give me the DPP for this product".

## Reference standards

[ISO 18975](https://www.iso.org/standard/85540.html) is a very minimal specification
that leaves many questions un-answered
(eg how to identify link types,
how to behave when asked about an unknown identifier
that is related to a known identifier).

Please refer to the detailed GS1 identity resolver specification
for more documentation - but remember to abstract it
to suit any identifier type (eg including non-gs1 identifiers).
https://ref.gs1.org/standards/resolver/

## Resolver discovery

<!-- TODO: Update this section with new resolver discovery process (data models) -->

The resolver discovery process is used to transform an identifier
(eg an ABN or a GTIN barcode)
into an [ISO 18975](https://www.iso.org/standard/85540.html) conforming identity resolver URL.
This step is not required when a [ISO 18975](https://www.iso.org/standard/85540.html) conforming resolver URL
is provided directly to the user
(eg as a QR code on a product or as a property in a data file).

This flow starts with the discovery of an identifier - whether scanned
from product packaging or found in a digital document.

```mermaid
flowchart
    A[Start] --> B[Read identifier]
    B --> C{Known scheme URI?}
    C -- Yes --> D[Get scheme rules]
    D --> E[Parse identfier string]
    E --> F[Construct resolver URL]
    C -- No ----> G[End:Unknown scheme]
```

The scheme URI may either be provided with the identifier in a data file
(eg a DPP) as follows

```
"identifier": {
    "schemeURI":"ato.gov.au/abn",
    "identifierValue":"41161080146"
}
```

or the schemeURI may be known by the identity resolver client
due to the context of the identifier discovery.
For example when using an app to scan a GS1 GTIN as a 1-D barcode,
it is likely that the app already knows that it is scanning
a GS1 GTIN and will know the schemeURI is `id.gs1.org/gtin`

The next step is to lookup the resolver configuration file
for the given schemeURI.
The configuration file may already be available
to the link resolver client or could be discovered
from an ecosystem manager such as the UNTP identifier scheme register.
The resolver configuration file will be of the form;

```
"identitySchemes":[
   {
    "schemeURI":"id.gs1.org/sgtin",
    "parsingTemplate":"Root <- 'sgtin' RestChars RestChars <- [a-zA-Z0-9]+",
    "resolverTemplate":"https://resolver.gs1.org/gtin/{id}",
    "linkTypes":"https://www.gs1.org/voc/?show=linktypes"
   },
   {
    next scheme...
   }
]
```

where

- schemeURI is the key to match the discovered schemeURI
  with the relevant resolver configuration rules.
- parsingTemplate (if needed) provides rules
  about how to parse the identifier
  needed for the identity resolver
  from the identifier string discovered by the client.
  For example to take the rightmost string
  from "urn:epc:id:sgtin:123456.23456.12345678".
- resolverTemplate provides the resolver URL with a placeholder `{id}`
  which should be substituted for the discovered
  (and optionally parsed) identifier.
- linkTypes provides a vocabulary reference
  for the link types expected from the list resolver service.

### Resolution flow

The resolution flow runs in the identity resolver service
when called with the identity resolver URL
constructed via the previous flow.
It needs to accommodate conditions where a resolution is requested
for an identifier that is unknown to the service
but is related to a known identifier - for example
calling GS1 global identity resolver with an sgtin
when it only knows about related gtin.

```mermaid
flowchart
    A[Start] --> B{valid element string?}
    B -- No --> C[error 400]
    B -- Yes --> D{identifier record found?}
    D -- No --> E{redirection possible?}
    D -- Yes --> F{link type requested?}
    E -- No --> G[not found 404]
    E -- Yes --> H[redirect to external <br>  resolver 307]
    F -- No --> I[redirect to default link 307]
    F -- Yes --> K{linktypes=all?}
    K -- Yes --> L[create/append list of links]
    L --> J{is there a less granular identifier?}
    J -- Yes --> L
    J -- No --> X[return list of links 200]
    K -- No --> M{matching link available?}
    M -- Yes --> N[redirect to matching <br>  link 307]
    M -- No --> O{matching link at next level?}
    O -- Yes --> P[redirect to requested link <br> type at next level up 307]
    O -- No --> Q[redirect to default 307]
```

### Link Types

Link types should be drawn from a controlled vocabulary such as http://localhost:3000/api/1.0.0/voc/?show=linktypes. UNTP may define a catalog of controlled link type vocabularies.

ResolverURLs may include the parameter `linkType` which can be set to any of the allowed link types for the given identifier scheme or can be set to "all". For example:

`http://localhost:3000/api/1.0.0/gs1/01/12345678901234/10/12345678901234567890?linkType=gs1:certificationInfo`

This URLis requesting the resolver to redirect the query to a target that provides certification information about the GTIN 12345678901234 with the batch/lot number 12345678901234567890.

In the event that linkType is set to `all`, the resolver should return a linkset structure as follows:

```json
{
  "linkset": [
    {
      "anchor": "http://localhost:3000/api/1.0.0/gs1/01/12345678901234/10/12345678901234567890",
      "http://localhost:3000/api/1.0.0/voc/certificationInfo": [
        {
          "href": "https://example.com",
          "title": "Certification Information",
          "type": "application/json",
          "hreflang": ["en"],
          "title*": [
            {
              "value": "Certification Information",
              "language": "en"
            }
          ]
        }
      ]
    }
  ]
}
```

### Resolve identity resolver

When the identity resolvers are registered, the anonymous user can make a query with the namespace, identifiers, mime type, accepted language and link type to resolve the identity resolver. For example, the user can query the identity resolver with the following URL:

```
http://localhost:3000/api/1.0.0/gs1/01/12345678901234/10/12345678901234567890?linkType=gs1:certificationInfo
```

The response will be redirected to the target URL (e.g., https://example.com)

### Response Determination Process

When processing a URI and returning the appropriate response, the system follows a specific order of precedence based on the linkType, ianaLanguage, context, and mimeType. This ensures that the most relevant and specific response is returned for each request. The order of precedence is as follows:

1. linkType, ianaLanguage, context, mimeType
2. linkType, ianaLanguage, context, defaultMimeType
3. linkType, ianaLanguage, context
4. linkType, ianaLanguage, defaultContext
5. linkType, ianaLanguage
6. linkType, defaultIanaLanguage
7. linkType
8. defaultLinkType

This hierarchical approach allows the system to find the most appropriate response by starting with the most specific combination of parameters and gradually falling back to more general options.

For example, if a request specifies a linkType, ianaLanguage, context, and mimeType, the system will first attempt to find a matching response with all these parameters. If no match is found, it will then look for a response with the default mimeType for that combination, and so on.

This process ensures that users receive the most relevant information based on their specific request parameters, while also providing fallback options when exact matches are not available.

## API Operations

The Link Resolution endpoint supports the following operations:

1. Resolve an identity resolver

See the [API specification](http://localhost:3000/api-docs#/Link%20Resolution) for details.
