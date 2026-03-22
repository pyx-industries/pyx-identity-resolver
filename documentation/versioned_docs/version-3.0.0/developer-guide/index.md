---
title: API Reference
sidebar_position: 1
---

# API Reference

The Pyx Identity Resolver exposes three API areas:

- **Identifier Management** --
  define the identifier schemes (namespaces and application identifiers) your resolver understands.
- **Link Registration** --
  register link responses against specific identifiers within a scheme.
- **Link Resolution** --
  resolve an identifier to its linked information.
  This is the public-facing surface that supply-chain actors hit.

For conceptual background on how the resolver works,
see [Understanding the Service](../understanding-the-service/).

Identifier Management and Link Registration require authentication.
Link Resolution is fully public -- no credentials needed.

:::tip Swagger UI — interactive API explorer
Your running instance ships with Swagger UI at
`{your-domain}/api-docs`.
It lists every endpoint, every field, and lets you fire test requests right from the browser.
The examples below are curated walkthroughs of the happy path;
for the full schema detail, Swagger is the canonical source.
:::

## Placeholders used in this guide

Throughout the examples you will see these placeholder values.
Replace them with values appropriate to your deployment.

| Placeholder | Meaning |
|---|---|
| `https://your-resolver.example.com/api/2.0.0` | Your resolver's base URL (global prefix included) |
| `YOUR_API_KEY` | A valid API key for authenticated endpoints |
| `acme` | An example namespace |
| `product` | An example primary identifier **shortcode** -- used in Link Registration (`identificationKeyType`) |
| `01` | The **AI code** for the same identifier -- used in Link Resolution URLs |
| `12345` | An example primary identifier key |
| `10/A1B2C3` | An example qualifier path segment (AI code `10` + value `A1B2C3`) |

---

## Authentication

Management endpoints (Identifier Management, Link Registration, and Link Management)
require an API key passed as a Bearer token:

```
Authorization: Bearer YOUR_API_KEY
```

Link Resolution endpoints are public and require no authentication.

---

## Identifier Management

Before you can register links,
you need to tell the resolver which identifier schemes it should accept.
An identifier scheme lives under a **namespace** and contains one or more
**application identifiers** -- each with a type, regex pattern, and optional qualifiers.

Each application identifier has two names:

- **`shortcode`** -- a human-readable name like `product` or `batch`.
  Used in Link Registration payloads (the `identificationKeyType` field).
- **`ai`** (application identifier code) -- a short numeric code like `01` or `10`.
  Used in Link Resolution URLs (the path segments that identify the item).

Both names refer to the same identifier --
`shortcode` is what you write when registering links,
and `ai` is what appears in the public resolution URLs.

:::note `ai` is optional for non-GS1 schemes
The `ai` field is required for GS1 schemes where a numeric AI code is meaningful
(e.g. `01` for GTIN, `10` for batch/lot).
For non-GS1 schemes, you may omit `ai` entirely --
the resolver will default it to the value of `shortcode`.
When `ai` defaults to `shortcode`, resolution URLs use the shortcode in the path
(e.g. `/{namespace}/product/12345`) rather than a numeric code.
:::

### Create an identifier scheme

Register a namespace called `acme` with two application identifiers:
a primary identifier `product` (type `I`) and a qualifier `batch` (type `Q`).

```bash
curl -X POST https://your-resolver.example.com/api/2.0.0/identifiers \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "acme",
    "applicationIdentifiers": [
      {
        "title": "Product ID",
        "label": "PRODUCT",
        "shortcode": "product",
        "ai": "01",
        "type": "I",
        "regex": "[A-Za-z0-9]+",
        "qualifiers": ["10"]
      },
      {
        "title": "Batch Number",
        "label": "BATCH",
        "shortcode": "batch",
        "ai": "10",
        "type": "Q",
        "regex": "[A-Za-z0-9]+"
      }
    ]
  }'
```

A successful `200` response:

```json
{
  "message": "Application identifier upserted successfully"
}
```

:::info Upsert behaviour
The endpoint uses **upsert** (create or update) semantics --
if the `acme` namespace already exists, the request replaces it.
That is why it returns `200` rather than `201`.
:::

### Retrieve an identifier scheme

Fetch the scheme you just created:

```bash
curl https://your-resolver.example.com/api/2.0.0/identifiers?namespace=acme \
  -H "Authorization: Bearer YOUR_API_KEY"
```

The response contains the full namespace object,
including all application identifiers and their validation rules.

Omit the `namespace` query parameter to retrieve every registered scheme.

### Delete an identifier scheme

:::danger Destructive — orphans all registered links
Deleting an identifier scheme does **not** cascade-delete
the links registered under it,
but it does make them **unreachable**.
Resolution, registration, and management all require the scheme to exist,
so any links that were registered against this namespace
will be permanently orphaned once the scheme is removed.

**Make sure you no longer need the scheme or any of its links
before you call this endpoint.**
:::

```bash
curl -X DELETE https://your-resolver.example.com/api/2.0.0/identifiers?namespace=acme \
  -H "Authorization: Bearer YOUR_API_KEY"
```

For full schemas and validation rules, see the Swagger UI.

---

## Link Registration

Once your identifier scheme is in place,
you can register **links** against specific identifiers.
Each registration targets a namespace + identifier key type + identifier key
(and optionally a qualifier path),
and contains one or more **responses** --
each pointing to a different URL with its own link type,
language tag (e.g., `en`, `fr-CA`),
MIME type (the content format, such as `text/html` or `application/pdf`),
and context (typically a geographic region code such as `au` or `us`).

### Register links

Register two responses for product `12345` in the `acme` namespace:
a sustainability information page and a product datasheet.

```bash
curl -X POST https://your-resolver.example.com/api/2.0.0/resolver \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "acme",
    "identificationKeyType": "product",
    "identificationKey": "12345",
    "description": "Acme Widget",
    "qualifierPath": "/",
    "active": true,
    "responses": [
      {
        "defaultLinkType": true,
        "defaultMimeType": true,
        "defaultIanaLanguage": true,
        "defaultContext": true,
        "fwqs": false,
        "active": true,
        "linkType": "acme:sustainabilityInfo",
        "ianaLanguage": "en",
        "context": "au",
        "title": "Sustainability Information",
        "targetUrl": "https://acme.example.com/products/12345/sustainability",
        "mimeType": "text/html"
      },
      {
        "defaultLinkType": false,
        "defaultMimeType": true,
        "defaultIanaLanguage": true,
        "defaultContext": true,
        "fwqs": false,
        "active": true,
        "linkType": "acme:productDatasheet",
        "ianaLanguage": "en",
        "context": "au",
        "title": "Product Datasheet",
        "targetUrl": "https://acme.example.com/products/12345/datasheet",
        "mimeType": "application/pdf"
      }
    ]
  }'
```

A successful `201` response:

```json
{
  "message": "Link resolver registered successfully"
}
```

:::note Deprecation notice
The `description` field replaces the deprecated `itemDescription` field.
Both are accepted for backwards compatibility, but `description` is preferred.
`itemDescription` will be removed in v3.0.
:::

:::caution Link type validation
Every `linkType` value is validated against a namespace-specific vocabulary.
Link types must use the format `prefix:key` (e.g. `gs1:certificationInfo`, `untp:dpp`).

- The `prefix` must be a registered vocabulary. Currently supported: `gs1`, `untp`.
- The `key` must be a known entry within that vocabulary.

Requests that use an unrecognised prefix or an unknown key are rejected with a `404` error.
If you are registering links for a custom namespace (e.g. `acme:`),
use the `gs1` or `untp` prefix for any standard link types,
or contact your resolver administrator to register a custom vocabulary.
:::

#### Append-only behaviour

Link Registration is **append-only** at the response level.
If a registration already exists for the same namespace, key type, key, and qualifier path,
the new responses are appended to the existing ones.

Each response is identified by a composite key of
`targetUrl`, `linkType`, `mimeType`, `ianaLanguage`, and `context`.
If any incoming response matches an existing composite key
(or a historical key from a previous version),
the request is **rejected with a `409 Conflict` error** --
duplicates are never silently merged or overwritten.

#### Forward query string (`fwqs`)

Each response carries a boolean `fwqs` (forward query string) flag.
When `fwqs` is `true` and the resolution results in a redirect,
any query parameters the caller includes on the resolution URL
are appended to the target URL before the redirect is issued.

A common use case is passing a `decryptionKey`
to a target that hosts encrypted content:

```
GET /api/2.0.0/acme/01/12345?linkType=acme:certificationInfo&decryptionKey=a3f2b8c1
```

If the matched response has `fwqs: true`,
the resolver redirects to:

```
https://example.com/cert?decryptionKey=a3f2b8c1
```

If the target URL already contains its own query string,
the forwarded parameters are appended with `&`.

When `fwqs` is `false` (the default),
query parameters are silently dropped during the redirect --
they are used only for resolution matching, not forwarded.

:::tip When to enable fwqs
Enable `fwqs` when the target URL needs caller-supplied parameters
(e.g. decryption keys, access tokens, or tracking identifiers).
Leave it disabled when the target URL is self-contained.
:::

#### Default flags

Each response carries a set of **default flags** that control resolution fallback behaviour.
For the full precedence explanation,
see [How It Works](../understanding-the-service/how-it-works).

| Flag | Scope | Purpose |
|---|---|---|
| `defaultLinkType` | Entire registration | Used when no `linkType` is specified in a resolution request |
| `defaultIanaLanguage` | Per link type | Used when a `linkType` is specified but no language preference |
| `defaultContext` | Per link type + language | Used when link type and language are known but no context |
| `defaultMimeType` | Per link type + language + context | Used when all other parameters are known but no MIME preference |

Only one response can hold a given default flag within its scope.
If you register a new response with a default flag set to `true`,
the system automatically unsets that flag on any existing response in the same scope.

#### Qualifier paths

To register links for a specific batch of product `12345`,
set the `qualifierPath` to the qualifier AI code and value:

```bash
"qualifierPath": "/10/A1B2C3"
```

The qualifier AI codes (`10` in this example) must correspond to valid qualifier types
defined in your identifier scheme,
and the values must match the regex pattern of that qualifier.

For full validation rules, see the Swagger UI.

---

## Link Management

Link Management provides CRUD operations
for individual link responses that were created via Link Registration.
Every response gets a unique `linkId` when it's registered --
Link Management endpoints use that `linkId`
to retrieve, update, or delete individual responses.

All Link Management endpoints require authentication
and live under `/resolver/links`.

### List links for an identifier

Retrieve all responses for a given identifier:

```bash
curl "https://your-resolver.example.com/api/2.0.0/resolver/links?namespace=acme&identificationKeyType=product&identificationKey=12345" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

You can narrow the results with optional filters:

| Parameter | Description |
|---|---|
| `qualifierPath` | Filter by qualifier path (e.g. `/10/A1B2C3`) |
| `linkType` | Filter by link type |
| `mimeType` | Filter by MIME type |
| `ianaLanguage` | Filter by language tag |

### Get a single link

Retrieve a specific response by its `linkId`:

```bash
curl https://your-resolver.example.com/api/2.0.0/resolver/links/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Update a link

Update any fields on a specific response.
Only the fields you include in the body are changed --
everything else stays as it is:

```bash
curl -X PUT https://your-resolver.example.com/api/2.0.0/resolver/links/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "https://example.com/updated-cert",
    "active": true
  }'
```

All fields from the original registration are updatable,
including `targetUrl`, `linkType`, `mimeType`, `ianaLanguage`, `context`,
`active`, `fwqs`, and the default flags.

:::info Composite key conflict checks
If you update fields that form part of the composite key
(`targetUrl`, `linkType`, `mimeType`, `ianaLanguage`, `context`),
the service checks for conflicts
against other current responses and historical keys
from previous versions.
The update is rejected with a `409 Conflict`
if the new composite key already exists.
:::

### Delete a link

By default, deletion is a **soft delete** --
the response is marked as inactive
but remains in the document and its composite key stays protected:

```bash
curl -X DELETE https://your-resolver.example.com/api/2.0.0/resolver/links/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

To permanently remove the response and free its composite key,
pass `?hard=true`:

```bash
curl -X DELETE "https://your-resolver.example.com/api/2.0.0/resolver/links/a1b2c3d4-e5f6-7890-abcd-ef1234567890?hard=true" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

:::warning Hard delete is irreversible
A hard delete permanently removes the response
and frees its composite key for reuse.
The response cannot be recovered after a hard delete.
:::

### Version history and predecessor links

Every mutation --
whether it's a create, update, or delete --
is recorded in the identifier document's version history.
Each history entry captures:

- The document **version number** at the time of the change.
- A **timestamp**.
- A list of **changes**,
  each identifying the `linkId`, the action performed
  (`created`, `updated`, `soft_deleted`, or `hard_deleted`),
  and -- for updates that change composite key fields --
  the **previous values** of `targetUrl`, `linkType`, `mimeType`,
  `ianaLanguage`, and `context`.

This history has two effects:

1. **Predecessor links in the linkset** --
   when a response's `targetUrl` changes,
   the previous URL appears as a
   [`predecessor-version`](https://www.iana.org/go/rfc6903)
   entry in the RFC 9264 linkset.
   This means anyone resolving the identifier can discover
   where the linked resource used to live.

2. **Conflict protection** --
   when you register or update a response,
   the service checks the new composite key
   against both current responses
   and all historical composite keys.
   This prevents a new response from silently reusing
   a key that previously pointed somewhere else.

For example,
if you update a response's `targetUrl` from
`https://example.com/v1/cert` to `https://example.com/v2/cert`,
the linkset for that identifier will include both:

- The current link pointing to `https://example.com/v2/cert`
- A `predecessor-version` entry pointing to `https://example.com/v1/cert`

---

## Link Resolution

Link Resolution is the public-facing API.
No authentication is needed.
You construct a URL from the namespace, the identifier's **`ai` code**, the identifier key,
and (optionally) qualifier path segments --
then add query parameters to narrow down the response you want.

Notice the switch from registration to resolution:
Link Registration uses the **shortcode** (`product`)
in the `identificationKeyType` field,
but resolution URLs conventionally use the **`ai` code** (`01`) in the path.
The resolver accepts either --
if you use the shortcode in a resolution URL it will still resolve correctly --
but the `ai` code is the standard form for public-facing URLs.

For a detailed explanation of how the resolver picks the right response,
see [How It Works](../understanding-the-service/how-it-works).

### Resolve a specific link type

Request the sustainability information for product `12345`:

```bash
curl -v https://your-resolver.example.com/api/2.0.0/acme/01/12345?linkType=acme:sustainabilityInfo
```

The resolver responds with a **307 redirect** to the target URL:

```
< HTTP/1.1 307 Temporary Redirect
< Location: https://acme.example.com/products/12345/sustainability
< Link: <https://your-resolver.example.com/api/2.0.0/acme/01/12345?linkType=all>; rel="linkset"; type="application/linkset+json"
```

Note the `Link` header --
every resolution response includes a pointer to the full linkset for the identifier.

The path structure is `/{namespace}/{identifierKeyType AI}/{identifierKey}`.
For qualified identifiers, append the qualifier segments:

```bash
curl -v https://your-resolver.example.com/api/2.0.0/acme/01/12345/10/A1B2C3?linkType=acme:sustainabilityInfo
```

#### Additional query parameters

| Parameter | Description |
|---|---|
| `linkType` | The link type to resolve (e.g. `acme:sustainabilityInfo`), or `all` for the full linkset |
| `accessRole` | Access role for variant-based disclosure filtering. Accepts a full URI (e.g. `myscheme:role#Admin`) or a shorthand like `customer` or `regulator` (expanded to `untp:accessRole#Customer` by default) |
| `decryptionKey` | Shared secret forwarded to the target URL when `fwqs` (forward query string) is enabled on the matched response |

### Content negotiation via Accept-Language

The resolver reads the standard HTTP `Accept-Language` header
to match against the `ianaLanguage` and `context` fields on registered responses.
The language subtag maps to `ianaLanguage`
and the region subtag maps to `context`.

For example, to request the Australian English variant:

```bash
curl -v https://your-resolver.example.com/api/2.0.0/acme/01/12345?linkType=acme:sustainabilityInfo \
  -H "Accept-Language: en-AU"
```

If a response is registered with `ianaLanguage: "en"` and `context: "au"`,
the resolver will prefer it.
When no exact match is found,
the resolver falls back through its
[precedence chain](../understanding-the-service/how-it-works)
until it finds a suitable response.

### Content negotiation via Accept (MIME type)

The resolver also reads the standard HTTP `Accept` header
to match against the `mimeType` field on registered responses.

For example, to prefer a PDF version:

```bash
curl -v https://your-resolver.example.com/api/2.0.0/acme/01/12345?linkType=acme:sustainabilityInfo \
  -H "Accept: application/pdf"
```

If a response is registered with `mimeType: "application/pdf"`,
the resolver will prefer it.
When no exact match is found,
the resolver falls back to the response flagged as `defaultMimeType`,
then continues through the
[precedence chain](../understanding-the-service/how-it-works).

The `Accept` header also controls the **response format**:

| Accept value | Behaviour |
|---|---|
| `application/linkset+json` | Returns the full linkset as JSON instead of redirecting |
| `application/linkset` | Returns the full set of Link header entries as `application/linkset+json` |
| Anything else | Redirects to the matched response's `targetUrl` (default) |

### Resolve with `linkType=all`

When you pass `linkType=all`,
the resolver returns a linkset
containing every active link for the identifier:

```bash
curl https://your-resolver.example.com/api/2.0.0/acme/01/12345?linkType=all
```

A **linkset** is a structured JSON document
(defined by [RFC 9264](https://datatracker.ietf.org/doc/html/rfc9264))
that lists every active link for an identifier in a machine-readable format.

Example response:

```json
{
  "linkset": [
    {
      "anchor": "https://your-resolver.example.com/api/2.0.0/acme/01/12345",
      "https://your-resolver.example.com/api/2.0.0/voc/sustainabilityInfo": [
        {
          "href": "https://acme.example.com/products/12345/sustainability",
          "title": "Sustainability Information",
          "type": "text/html",
          "hreflang": ["en"]
        }
      ],
      "https://your-resolver.example.com/api/2.0.0/voc/productDatasheet": [
        {
          "href": "https://acme.example.com/products/12345/datasheet",
          "title": "Product Datasheet",
          "type": "application/pdf",
          "hreflang": ["en"]
        }
      ]
    }
  ]
}
```

:::info Link type URLs in the linkset
Notice that the link type keys in the linkset are full URLs
(e.g., `https://your-resolver.example.com/api/2.0.0/voc/sustainabilityInfo`),
not the prefixed form you used during registration (`acme:sustainabilityInfo`).
The resolver automatically expands the namespace prefix
into the full vocabulary URL when building the linkset.
:::

### Resolver discovery

The `.well-known/resolver` endpoint returns metadata about the resolver itself --
which namespaces it supports, which link type vocabularies it uses,
and its root URL:

```bash
curl https://your-resolver.example.com/api/2.0.0/.well-known/resolver
```

Example response:

```json
{
  "name": "My Identity Resolver",
  "resolverRoot": "https://your-resolver.example.com/api/2.0.0",
  "supportedLinkType": [
    {
      "namespace": "https://acme.example.com/voc/",
      "prefix": "acme:",
      "profile": "https://acme.example.com/voc/?show=linktypes"
    }
  ],
  "supportedPrimaryKeys": ["all"]
}
```

This endpoint is public and requires no authentication.

For full query parameters and response schemas, see the Swagger UI.
