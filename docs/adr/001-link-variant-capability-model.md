# ADR 001: Link target variants as capability advertisement

## Status

accepted

## Context

The Pyx Identity Resolver (IDR) models registered link variants for an identifier. Each variant points at a target URL with metadata describing what the target serves. Two questions sit at the centre of the variant model:

1. What does a variant entry represent? A single concrete (URL, language, format) tuple, or a single URL endpoint with a capability profile?
2. Where does per-request content negotiation happen? In the resolver (which switches between variant rows based on the client's preferences), or in the target service (which inspects the request and responds appropriately)?

Two adjacent constraints frame the answer.

The UNTP Identity Resolver v0.7 specification (LinksetSchema) defines `hreflang` on each link target as an array of BCP 47 language tags, with no separate single-value language field or default-language flag. The spec embeds a particular model for how variants represent language coverage.

The current IDR (v3.x) models language as a single-value `ianaLanguage` field per variant plus a `defaultIanaLanguage` boolean, with `ianaLanguage` participating in the variant composite key. Under this model, registering a service that serves three languages requires three variant entries that differ only by `ianaLanguage`, and the composite key forces the resolver to treat each language as a distinct addressable variant.

Conforming to UNTP IDR v0.7 is the immediate driver; the v0.7 milestone (#104) tracks the full conformance push and this is one of several structural changes within it. Other v0.7 changes (`rel`, `public`, permissive `mimeType`, OpenAPI hygiene) shipped in #99, #100, #101, and #103 without raising the same architectural question because they were additive metadata. The hreflang change is different: it forces a choice between two coherent models of what a variant is for, and the choice ripples through the composite key, the resolver, and the linkset emission.

## Decision

A link target variant in the IDR represents a single URL endpoint that advertises the set of language representations it serves. The IDR does not split a service into per-language variant entries. When a client requests a specific language, the IDR selects between services whose advertised `hreflang[]` contains the requested tag and redirects to the chosen URL; the target service performs per-request content negotiation (RFC 9110 §12 server-driven negotiation, typically via `Accept-Language` per §12.5.4) to return the appropriate representation.

Concretely:

- `hreflang: string[]` on each variant, optional, with BCP 47 validation per item per the LinksetSchema regex.
- `ianaLanguage` and `defaultIanaLanguage` removed.
- Variant composite key is `(targetUrl, linkType, mimeType, context)`; language is not part of variant identity.
- The resolver's role for language is to route (which service serves this language), not to negotiate format (which language representation to return).

## Consequences

**Easier:**

- A single registered URL accurately describes a multi-lingual service. Publishers stop maintaining N redundant rows that differ only by language tag.
- The variant key is simpler. Conflict detection and update tracking shrink by one field.
- The model aligns with the UNTP IDR v0.7 LinksetSchema and with how RFC 9110 expects HTTP services to behave. Future consumers reading the linkset can rely on standard HTTP semantics for the final hop.
- The resolver does less. It does not own the question "which language representation does this client want?" beyond capability-level routing.

**Harder:**

- Target services must do their own content negotiation. The IDR no longer hides services that don't honour `Accept-Language` — a non-negotiating service registered with multiple `hreflang` values may return the wrong language. This is the publisher's responsibility, not the IDR's.
- Existing stored variant data uses the old model and must be migrated to the 4-tuple key with merged hreflang arrays (#109).
- This is a breaking change to the public API contract. Publishers integrating with the IDR must update their registration payloads. Released as a major version bump.

## Open question: mimeType asymmetry

The capability-advertisement model implies that `mimeType` (the linkset's `type` field) should also be an array, since the same content-negotiation argument applies to format: a service that serves both `application/vc+ld+json` and `application/vc+jwt` from the same URL should be expressible as one variant with both formats. The UNTP IDR v0.7 LinksetSchema keeps `type` as a single string, so the IDR follows the spec exactly. The asymmetry is tracked at #118, which proposes raising an upstream question with the UNTP maintainers. If the spec is updated, this ADR will be revisited.

## Alternatives Considered

**Per-language variant entries (status quo v3.x model).** Rejected. The model treats language as part of variant identity, which forces publishers to register one URL per language even when the underlying service handles content negotiation. It also diverges from the UNTP IDR v0.7 LinksetSchema, which would block downstream consumers that expect the v0.7 shape.

**hreflang as an array but keep `ianaLanguage` as a "default" or "primary" single-value field.** Rejected. The two representations would carry overlapping information with no normative rule for which wins on conflict. The UNTP spec does not include any per-variant "primary language" concept, so the extra field would have no upstream meaning. It would also leave the composite key at 5 fields, defeating the simplification.

**Soft-deprecation of `ianaLanguage` as an alias.** Accept old-shape payloads and internally map `ianaLanguage: 'en'` to `hreflang: ['en']`, similar to the `itemDescription` to `description` deprecation that shipped in #96. Rejected. The migration carries data-shape implications beyond the input layer (composite key, version-history tracking, linkset emission), and the alias would persist long after the cut-over because consumers would have no forcing function to update. A clean break aligned with a major version bump confines the cost to one release window.

**Resolver-side content negotiation (keep per-language variants and have the resolver match `Accept-Language` directly to one of them).** Rejected. Builds resolver-internal logic that duplicates work HTTP servers already do, and entrenches the per-language variant model the spec moved away from. It also pushes the resolver into a representation-switching role that conflates routing with content negotiation; future format dimensions (encodings, scripts) would each need parallel handling.

## References

- #106 — Publishers can register and retrieve a link variant with hreflang
- #104 — Epic: UNTP IDR v0.7 conformance
- #109 — Migrate existing stored link variants to the new 4-tuple key model
- #116 — Follow-up: Resolver honours `Accept-Language` header
- #117 — Follow-up: Resolver applies BCP 47 fallback when matching hreflang
- #118 — Follow-up: Raise upstream question about `type` singular vs `hreflang` array
- UNTP IDR LinksetSchema — `hreflang` definition
- RFC 9110 §12 — Content Negotiation
- RFC 9264 — Linkset format
