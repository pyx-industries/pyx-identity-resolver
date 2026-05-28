# Pyx Identity Resolver release notes

These are the user-facing release notes for the Pyx Identity Resolver
(IDR). They focus on what changes for you, the operator or integrator,
in each release. For a technical, per-change log see
[CHANGELOG.md](./CHANGELOG.md).

Each release-prep PR adds a new section at the top of this file with a
human-readable summary of what shipped, a link to the relevant
migration guide (if any), and the published container image tag.

The first release cut under this workflow will populate the next
section. See
[RELEASE_MANAGEMENT_GUIDE.md](./RELEASE_MANAGEMENT_GUIDE.md) for the
maintainer-facing flow and
[documentation/docs/contributing/release-process.md](./documentation/docs/contributing/release-process.md)
for the user-facing version.

---

## v4.0.0 (2026-05-28)

Container image: `ghcr.io/pyx-industries/pyx-identity-resolver:4.0.0`
(plus `:4.0.0-serverless` for AWS Lambda).

Migration guide:
[3.x to 4.0.0](./documentation/docs/migration-guides/v4.md).

### What changed

v4.0.0 aligns the IDR with [UNTP Identity Resolver v0.7](https://untp.unece.org/docs/specification/IdentityResolver). This is a breaking release with three coordinated changes: a new link variant data model, a new API URL shape, and a base-URL-only `RESOLVER_DOMAIN`.

#### Link variant data model: 5-tuple to 4-tuple with `hreflang[]`

The scalar `ianaLanguage` field on each link variant is retired in favour of a `hreflang: string[]` array, so the composite key drops from `(targetUrl, linkType, mimeType, ianaLanguage, context)` to `(targetUrl, linkType, mimeType, context)`. A single variant can now advertise multiple BCP 47 language tags. The resolver matches `Accept-Language` against each variant's `hreflang[]` array; see the [migration guide](./documentation/docs/migration-guides/v4.md) for the full cascade.

#### API URL versioning: major-only `/api/v<MAJOR>`

The API URL path now carries only the major version. The base path moves from `/api/3.0.0` to `/api/v4`. Minor and patch bumps no longer break URLs; only a breaking change moves the major segment. The path is derived from `apiVersion` in `version.json`. See [ADR 002](./docs/adr/002-major-only-api-url-versioning.md) for the rationale.

#### `RESOLVER_DOMAIN` configuration: base URL only

`RESOLVER_DOMAIN` is now the externally-reachable base URL only (scheme + host, no path, no trailing slash). The service appends `/api/v4` internally. `API_BASE_URL` and `LINK_TYPE_VOC_DOMAIN` are retired; `RESOLVER_DOMAIN` is the single source of truth, and the link-type vocabulary base can be overridden per identifier by setting `namespaceURI` on the identifier record.

#### Additive variant fields and MIME loosening

These are additive and do not require operator action; publishers can opt in once on v4.

- **`public: boolean`** on each variant. Indicates the URL itself is safe to publish in a public directory. Distinct from `accessRole` and `encryptionMethod`, which govern who may *retrieve or decrypt* the resource.
- **`rel: string[]`** on each variant. Carries additional link relation types qualifying the variant beyond its primary `linkType`. The reserved value `predecessor-version` is silently stripped from publisher input; the server emits it itself on predecessor entries derived from version history.
- **MIME type loosening.** The service now accepts any RFC 6838 well-formed media type (including custom and vendor-prefixed types such as `application/vnd.acme.sbom+json`); v3 rejected anything outside a curated list.

The full per-variant field reference, including pre-existing fields that were under-documented in earlier versions, lives in the [Developer Guide](./documentation/docs/developer-guide/index.md#variant-fields).

### Data migration

v4 ships a one-shot CLI command (`yarn migrate:v4`) that operators
run between stopping v3 and starting v4. The migration:

- Groups responses by the new 4-tuple and merges each group into a
  single response (first-registered-by-`createdAt` wins; the
  discarded variants' `ianaLanguage` values are unioned into the
  survivor's `hreflang[]`).
- Strips the retired `ianaLanguage` and `defaultIanaLanguage` fields
  from every response.
- Rebuilds the pre-computed linkset from the merged responses.
- Rewrites version-history `previousIanaLanguage` scalars to
  `previousHreflang[]` arrays.
- Deletes orphan `_index/links/{linkId}.json` entries for variants
  that did not survive the merge.

The migration is idempotent (a doc already in v4 shape is a no-op),
supports `--dry-run`, `--continue-on-error`, `--only <id>`, and
`--verbose`, and fail-fasts on the first per-document error by
default.

The
[3.x to 4.0.0 migration guide](./documentation/docs/migration-guides/v4.md)
covers backup, dry-run, real-run, env var changes, and recovery
steps. **Take a full bucket snapshot before running the migration.**

### Action required for operators

1. **Snapshot your object storage bucket.** The migration is
   destructive in the sense that it overwrites each migrated
   document in place; without a backup, there is no rollback path.
2. **Stop the v3 service.**
3. **Pull the v4 container image:**
   `docker pull ghcr.io/pyx-industries/pyx-identity-resolver:4.0.0`.
4. **Update `RESOLVER_DOMAIN`** to the base URL only (drop
   `/api/3.0.0`). **Remove `API_BASE_URL`** if previously set.
   **Remove `LINK_TYPE_VOC_DOMAIN`** if previously set.
5. **Run the migration in `--dry-run` mode** and review the output.
   Reconcile any documents where divergent metadata would be lost
   by the first-registered-wins merge rule.
6. **Run the migration** (`yarn migrate:v4`) and confirm
   `Failed: 0`.
7. **Start the v4 service.**

### Action required for API clients

- API base path moves from `/api/3.0.0` to `/api/v4`. Update every client URL.
- The `?ianaLanguage=<tag>` query parameter on `GET /resolver/links` has been replaced with `?hreflang=<tag>`.
- Registration payloads no longer accept `ianaLanguage` or `defaultIanaLanguage`. Replace them with `hreflang: string[]` on each variant. Include the regional subtag (e.g. `["en-AU"]`) if you want region-specific routing.
- BCP 47 lookup fallback is not implemented (tracked in [#117](https://github.com/pyx-industries/pyx-identity-resolver/issues/117)); a request for `en-AU` will not match a variant tagged only `["en"]`.

See [Migrating from 3.x to 4.0.0](./documentation/docs/migration-guides/v4.md) for the full upgrade walkthrough.
