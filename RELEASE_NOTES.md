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

## v4.0.1 (2026-10-23)

Container image: `ghcr.io/pyx-industries/pyx-identity-resolver:4.0.1`
(plus `:4.0.1-serverless`; see Known limits).

No migration guide: the API is unchanged, the base path stays
`/api/v4`, and stored data needs no migration.

### What changed

v4.0.1 is a security patch on the 4.0 line, for deployments that stay
on 4.0 for now. It rebuilds both images on the current Node.js 22
release and clears the critical advisories, and the high advisories
that are not denial of service only, in the packages the service loads.
Release 4.1.0 remains the newest release.

#### Node.js runtime

Both images are rebuilt on their Node.js 22 base images, `node:22-alpine`
for the standard image and `public.ecr.aws/lambda/nodejs:22` for the
serverless image, and run Node.js 22.23.4 or later.

#### Security fixes in dependencies

- `axios` moves from 1.7.5 to 1.20.0, which brings `form-data` 4.0.6
  and `follow-redirects` 1.16.1.
- `minio` moves from 8.0.1 to 8.0.7, which brings `fast-xml-parser`
  5.11.2 in place of 4.4.1 and clears the `fast-xml-parser` advisories.
  Listings of large prefixes keep working. The patched 4.x parser
  releases reject a MinIO listing page of 501 or more objects, so the
  service moves to the 5.x parser that minio 8.0.7 uses.
- `proxy-addr` moves from 2.0.7 to 2.0.8.
- `lodash` moves from 4.17.21 to 4.18.1.
- `validator` moves from 13.12.0 to 13.15.22.

#### Behaviour that changes with the updates

- **`targetUrl` validation.** Link registration and link updates check
  `targetUrl` with `validator`, and 13.15.22 differs from 13.12.0 in
  three ways:
  - A scheme followed by the host with no slashes, such as
    `https:example.com`, is now accepted. 4.0.0 rejected it.
  - A scheme followed by a single slash, such as `https:/example.com`,
    is now rejected with a 400. 4.0.0 accepted it.
  - The longest accepted URL grows from 2,082 to 2,084 characters.

  Links already stored are not validated again, so resolving them is
  unaffected.
- **Object store retries.** minio 8.0.7 retries a request once, after
  200 to 400 ms, when the object store answers 408, 429, 499, 500, 502,
  503, 504 or 520. It writes a `console.warn` line for each retry. If
  the retry fails the same way, the error starts with
  `Request failed after 1 retries` and names the HTTP status.
- **MinIO image for the quick start and end-to-end tests.** The
  repository's `docker-compose.yaml` now pulls MinIO from `pgsty/minio`,
  pinned by digest, in place of `quay.io/minio/minio`, whose tag no
  longer pulls. The service images do not include MinIO.

#### Image tags

A 4.0.1 release publishes `4.0.1` and `4.0.1-serverless` only.
`latest` and `latest-serverless` stay on the newest release. The image
workflow on this line refuses a tag or a manual version that is not
`MAJOR.MINOR.PATCH`.

### Known limits

- The serverless image does not start under the AWS Lambda Node.js 22
  runtime, as in 4.0.0. A fix will follow in a later release.
- High advisories that are denial of service only remain in
  `body-parser`, `braces`, `js-yaml`, `multer`, `path-to-regexp` and
  `picomatch`.
- Both images install development dependencies as well, so container
  scanners still report critical advisories in `handlebars` and
  `websocket-driver`, and high advisories in other development-only
  packages. The service does not load them.

### Action required for operators

Before you upgrade, check that no client registers or updates a link
with a `targetUrl` of the form `https:/host` (a scheme and a single
slash). 4.0.1 rejects it with a 400.

1. **Pull the v4.0.1 standard image:**
   `docker pull ghcr.io/pyx-industries/pyx-identity-resolver:4.0.1`,
   then restart the service. No configuration change or data migration
   is needed.

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
