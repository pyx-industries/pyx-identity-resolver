---
sidebar_position: 1
title: What is the Identity Resolver?
---

# What is the Identity Resolver?

Every product, facility, piece of equipment, and organisation has identifiers —
barcodes, serial numbers, registration codes, business numbers.
But knowing an identifier only gets you so far.
The real question is:
**given an identifier, where can I find more information about the thing it identifies?**

Think of the Pyx Identity Resolver (IDR) as a phone book for identifiers.
You look up an identifier and get back a set of links
pointing to information about that thing —
sustainability reports, product datasheets, certifications, compliance records,
or anything else the identifier's owner has chosen to publish.

## What the IDR does

The IDR is a service that sits between identifiers and the information about them.
It does two things:

1. **Registration** — Identifier owners register links against their identifiers.
   Each link points to a specific piece of information (a target URL)
   and is described by metadata like link type, language, and media format.
   See the [Developer Guide](../developer-guide/) for full API details.

2. **Resolution** — Anyone who encounters an identifier can resolve it
   through the IDR to discover what information is available
   and be directed to the right place.

You register once; anyone can resolve.
The service handles the mapping between structured identifiers
and the web resources that describe them.

## Who uses this service

Different people interact with the IDR in different ways,
depending on what they need.

### You, the registry operator

You deploy and manage the resolver.
You define which identifier schemes your instance supports —
perhaps product codes, facility numbers, equipment identifiers, or all of the above.
You control the infrastructure and configuration.

For example,
Acme Corp might operate a resolver for their `acme` identifier scheme,
covering product identifiers, batch codes, and facility numbers.

### Registered members

These are the companies and organisations that own identifiers
within your registry.
They use the registration API to add links against their identifiers,
pointing to product datasheets, sustainability reports, certifications,
and other resources.

For example,
a manufacturer registered under the `acme` scheme
might register links for product `12345`,
pointing to a sustainability report and a product datasheet.

### Anonymous users

Anyone who encounters an identifier can look it up.
A consumer scanning a code on a product,
a supply chain partner checking batch information,
or a recycling facility looking up disassembly instructions —
none of them need an account or API key to resolve an identifier.

Resolution is open by design.

### Authorised users

Some information is not public.
Authorised users have credentials that grant access
to restricted link responses —
things like bill-of-materials data, compliance records,
or pricing information
that the identifier owner has chosen to protect.

An authorised user is distinct from a registered member:
they typically have read access to information
about identifiers they do not own.
A customs agency verifying compliance data
or a recycling plant accessing disassembly instructions
are good examples.

## Access control

The IDR deliberately separates resolution from registration:

- **Resolution is open.** Anyone can resolve an identifier. No authentication required.
  The target URLs that links point to may require their own authentication,
  but the act of looking up "what links exist for this identifier" is always public.

- **Registration requires an API key.** Only authenticated users
  can register, update, or manage links.
  This protects the integrity of the data
  while keeping discovery open.
  See the [Deployment Guide Configuration](../deployment-guide/configuration)
  for how to set API keys.

:::tip Resolution is open by design
Anyone can resolve an identifier without credentials.
This is intentional — identifiers are most useful
when the information about them is easy to discover.
Access control happens at the target resource, not at the resolver.
:::

This split ensures that identifiers are useful to everyone who encounters them,
while still giving identifier owners control over what gets published.

## Standards compliance

The IDR implements several open standards
so that identifiers and links work consistently
across different systems and organisations.
You do not need to understand these standards to use the service —
the IDR handles compliance for you —
but here is what is under the hood:

- **[ISO 18975](https://www.iso.org/standard/85540.html)** —
  Defines a universal way to turn identifiers into web addresses.
  This is the standard that governs how resolver URLs are structured,
  so that any client that understands ISO 18975
  can resolve identifiers from any compliant resolver.

- **[RFC 9264](https://datatracker.ietf.org/doc/html/rfc9264)** —
  Defines the linkset format, which is the structured JSON format
  the resolver uses to return a set of links.
  When you ask the resolver "what links exist for this identifier?",
  the response follows this format.

- **[RFC 8288](https://datatracker.ietf.org/doc/html/rfc8288)** —
  The web standard for Link headers.
  The resolver includes Link headers in HTTP responses
  so that clients can discover related resources
  through standard HTTP mechanisms.

- **[GS1 Digital Link](https://ref.gs1.org/standards/digital-link/1.1.3/)** —
  A real-world implementation of these standards for product barcodes.
  If you are working with GS1 identifiers (GTINs, GLNs, SSCCs),
  the IDR supports the GS1 Digital Link standard out of the box.
  But the IDR is not limited to GS1 —
  it works with any identifier scheme you define.
