---
sidebar_position: 3
title: FAQ
---

# Frequently Asked Questions

## What identifier schemes can this service handle?

Any scheme you define.
The IDR is not limited to a particular standard or industry.
You create a namespace, define your identifier types and qualifiers,
and the resolver handles the rest.

Product barcodes, business registration numbers, facility codes,
equipment serial numbers, document identifiers —
if it has a structured identifier, the IDR can resolve it.
GS1 Digital Link is one well-known scheme the IDR supports,
but it is just one of many possibilities.

## Do I need to understand ISO 18975 or RFC 9264 to use this service?

No.
The IDR implements these standards under the hood
so you do not have to.
When you register links and resolve identifiers through the API,
the service automatically produces standards-compliant URLs, linksets, and Link headers.

If you are curious,
[ISO 18975](https://www.iso.org/standard/85540.html) governs how resolver URLs are structured,
and [RFC 9264](https://datatracker.ietf.org/doc/html/rfc9264) defines the linkset format
used when the resolver returns a set of links.
But you can use the IDR without ever reading either specification.

## Can anonymous users see everything?

Anonymous users can resolve any registered identifier
and discover what links are available.
However, the target URLs those links point to
may require their own authentication.

Think of it this way:
the resolver tells you "there is a sustainability report at this URL"
regardless of who you are.
Whether you can actually access that URL
is up to the resource owner, not the resolver.

Additionally, identifier owners can register responses
with access role restrictions.
These responses are only visible to authorised users
who present the right credentials during resolution.

## What happens if an identifier is not registered?

If the namespace exists but the specific identifier has no links registered,
the resolver returns a `404 Not Found` response.
However, if a related identifier exists at a less granular level —
for example, the product is registered but not the specific batch —
the resolver may redirect to the less specific match instead of returning a 404.

## Can I run multiple identifier schemes on one instance?

Yes.
Each namespace is independent.
A single IDR instance can handle `acme`, `gs1`,
and any other namespace simultaneously,
each with its own identifier types, qualifiers, and registered links.

:::note
This makes the IDR suitable for organisations
that manage multiple identifier schemes
or want to offer resolution services across different domains.
See the [Deployment Guide](../deployment-guide/configuration)
for configuration options when running multiple namespaces.
:::

## How does this differ from a URL shortener?

A URL shortener maps one short URL to one destination.
The IDR maps a structured identifier to potentially many destinations,
each described by metadata like link type, language, context, and format.

When you resolve an identifier,
the resolver does not just redirect you to a single URL.
It understands what kind of information you are looking for,
what language you prefer, and what region you are in,
and it picks the best matching response from everything that has been registered.

If you ask for all links at once,
the resolver returns a structured linkset document
listing every available resource for that identifier.

## Is this only for products?

Not at all.
The IDR works with any kind of entity that has an identifier:

- **Products** — barcodes, serial numbers, model codes
- **Facilities** — factory identifiers, warehouse codes, location numbers
- **Equipment** — asset tags, machinery serial numbers
- **Organisations** — business registration numbers, company identifiers
- **Documents** — document reference numbers, certificate identifiers

The identifier scheme you define determines what the resolver handles.
There is nothing product-specific in the service itself.

## What format does the resolver return?

It depends on the request:

- **Specific link type** — The resolver redirects (HTTP 307) to the target URL
  of the best matching response.
  The response also includes Link headers and a linkset
  so clients can discover other available links.

- **All link types** (`linkType=all`) — The resolver returns a JSON document
  in the [RFC 9264 linkset format](https://datatracker.ietf.org/doc/html/rfc9264),
  listing every active link registered for that identifier.

In both cases,
the HTTP response includes Link headers
following [RFC 8288](https://datatracker.ietf.org/doc/html/rfc8288)
for clients that prefer header-based link discovery.

See the [Developer Guide](../developer-guide/) for full request and response examples.
