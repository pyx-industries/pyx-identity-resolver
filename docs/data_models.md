# Data Model

## Identifier

The identifier data model represents the identifier schemes registered within the identity resolver.

Each identifier scheme is represented by a single JSON object. We use a combination of environment variables and namespace to construct the key for the object: `{OBJECT_STORAGE_BUCKET_NAME}/{IDENTIFIER_PATH}/{namespace}.json`.

The identifier data model serves to:

1. Validate link resolvers being registered with the identity resolver.
2. Determine which identifier schemes can be resolved.
3. Establish the link types that can be registered for an identifier scheme.

```jsonc
// idr-bucket/identifiers/gs1.json
{
  "id": "identifiers/gs1",
  "namespace": "gs1",
  "namespaceURI": "",
  "namespaceProfile": "",
  "applicationIdentifiers": [
    {
      "title": "Global Trade Item Number (GTIN)",
      "label": "GTIN",
      "shortcode": "gtin",
      "ai": "01",
      "type": "I",
      "regex": "(\\d{12,14}|\\d{8})",
      "qualifiers": ["10"]
    },
    {
      "title": "Batch or lot number",
      "label": "BATCH/LOT",
      "shortcode": "lot",
      "ai": "10",
      "type": "Q",
      "regex": "([\\x21-\\x22\\x25-\\x2F\\x30-\\x39\\x41-\\x5A\\x5F\\x61-\\x7A]{0,20})"
    }
  ]
}
```

## Link Resolver

The Link Resolver data model represents the configuration for resolving a specific identifier to its associated links and metadata. It is used to store and manage resolution information for individual identifiers within the identity resolver system.

Each link resolver is represented by a single JSON object. We use a combination of parameters from the link registration request to construct the key for the object: `{namespace}/{identificationKeyType > ai}/{identificationKey}/{qualifierPath ?? ''}.json`.

The Link Resolver data model is used to:

1. Store the link resolver configuration for a specific identifier.
2. Store metadata for a specific identifier.
3. Store responses (redirects) for a specific identifier.
4. Store the link set for a specific identifier.

```jsonc
// gs1/01/12345678901234/10/123456789012345678902.json
{
  "id": "gs1/01/12345678901234/10/123456789012345678902.json",
  "createdAt": "2024-09-02T06:19:58.783Z",
  "linkset": {
    "anchor": "http://localhost:3000/gs1/01/12345678901234/10/123456789012345678902",
    "http://localhost:3000/voc/certificationInfo": [
      {
        "href": "https://example.com",
        "title": "Certification Information",
        "type": "application/json",
        "hreflang": ["en"],
        "title*": [{ "value": "Certification Information", "language": "en" }]
      }
    ]
  },
  "linkHeaderText": "<https://example.com>; rel=\"gs1:certificationInfo\"; type=\"application/json\"; hreflang=\"en\"; title=\"Certification Information\", <http://localhost:3000/gs1/01/12345678901234/10/123456789012345678902>; rel=\"owl:sameAs\"",
  "namespace": "gs1",
  "identificationKeyType": "gtin",
  "identificationKey": "12345678901234",
  "itemDescription": "Product description",
  "qualifierPath": "/10/123456789012345678902",
  "active": true,
  "responses": [
    {
      "defaultLinkType": true,
      "defaultMimeType": true,
      "fwqs": false,
      "active": true,
      "linkType": "gs1:certificationInfo",
      "title": "Certification Information",
      "targetUrl": "https://example.com",
      "mimeType": "application/json",
      "ianaLanguage": "en",
      "context": "au",
      "defaultContext": true,
      "defaultIanaLanguage": true
    }
  ]
}
```

This data model enables the identity resolver to store, retrieve, and manage link resolution information for various identifiers across different identifier schemes.
