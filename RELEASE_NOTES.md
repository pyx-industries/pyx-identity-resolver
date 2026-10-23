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

## v4.1.0 (2026-10-23)

Container image: `ghcr.io/pyx-industries/pyx-identity-resolver:4.1.0`
(plus `:4.1.0-serverless` for AWS Lambda).

No migration guide: the API is unchanged, the base path stays
`/api/v4`, and stored data needs no migration.

### What changed

v4.1.0 clears the critical advisories in the service's dependencies,
runs the standard image as a non-root user with a Docker health check,
and moves the service to structured logging.

#### Security fixes in dependencies

- The open critical dependency advisories in the service and
  documentation lockfiles are cleared. The service now resolves
  `follow-redirects` 1.16.1, `form-data` 4.0.6 and `proxy-addr` 2.0.8,
  and the development dependencies `handlebars` 4.7.10 and
  `websocket-driver` 0.7.5.
- `axios` moves from 1.7.5 to 1.20.0.
- `minio` moves from 8.0.1 to 8.0.7, which brings `fast-xml-parser`
  5.11.2 in place of 4.4.1 and clears the `fast-xml-parser` advisories.
  Listings of large prefixes keep working. The patched 4.x parser
  releases reject a MinIO listing page of 501 or more objects, so the
  service moves to the 5.x parser that minio 8.0.7 uses.
- The images no longer set `OBJECT_STORAGE_URL`,
  `OBJECT_STORAGE_ROOT_USER` and `OBJECT_STORAGE_ROOT_PASSWORD`. The
  service never read them, and the last two held MinIO's public default
  credentials. Storage settings still come from
  `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_ACCESS_KEY`,
  `OBJECT_STORAGE_SECRET_KEY` and the other `OBJECT_STORAGE_*`
  variables.

#### Standard image runs as `node` with a health check

- The standard image now runs the service as the unprivileged `node`
  user instead of root. The service writes nothing to disk, so no files
  or volumes need a change of ownership.
- The image declares a Docker `HEALTHCHECK` that requests
  `/api/v<major>/health-check` (currently `/api/v4/health-check`) on
  `PORT` (default `3000`) every 30 seconds, with a 15-second start
  period, a 10-second timeout and 3 retries. `docker ps` and Docker
  Compose report the container as `healthy` or `unhealthy`. Kubernetes
  does not use Docker health checks, so configure its probes against
  the same path.
- The serverless image does not gain the `node` user or the health
  check. It does get the dependency, logging and retry changes in
  these notes.

#### Structured logging

- The service now logs through Pino. Framework and start-up messages
  go through the same pipeline. Each HTTP request writes a completion
  line with its response time, at `error` for 5xx responses, `warn`
  for 4xx and `info` otherwise. Log lines for the same request carry
  the same request id. The `Authorization` and `Cookie` request headers
  are redacted.
- Two new environment variables control the output. Set them in the
  process or container environment: the service reads them before it
  loads `.env.*.local` files, so values there have no effect.
  - `LOG_LEVEL`: the minimum level to emit, one of `trace`, `debug`,
    `info`, `warn`, `error`, `fatal` or `silent`. Default `info`. Any
    other value, including an empty one, stops the service at start-up.
  - `LOG_PRETTY`: `true` prints human-readable lines through
    `pino-pretty`, and any other value prints one JSON object per line.
    When it is unset, output is pretty-printed if `NODE_ENV` is
    `development` and JSON otherwise.

#### Documentation

The documentation is published as version 4.1.0. The storage
providers page's Compose example now pulls MinIO from `pgsty/minio`,
pinned by digest, in place of `quay.io/minio/minio`.

### Known limits

- A link resolution request with an odd-length qualifier path still
  writes its parsing error with `console.error`, as plain text outside
  the structured logs.
- minio 8.0.7 retries a request once, after 200 to 400 ms, when the
  object store answers 408, 429, 499, 500, 502, 503, 504 or 520. That
  covers reads, writes and the bucket check at start-up. It writes a
  `console.warn` line for each retry, outside the service's structured
  logs. If the retry gets one of those statuses again, the error starts
  with `Request failed after 1 retries` and names the HTTP status, but
  carries no S3 error code. minio
  does not read the failed response before retrying, so that connection
  stays busy until it closes.

### Action required for operators

1. **Pull the v4.1.0 container image:**
   `docker pull ghcr.io/pyx-industries/pyx-identity-resolver:4.1.0`,
   then restart the service. No data migration is needed.
2. **Check your log settings.** If you set `NODE_ENV=development`, as
   the repository's `docker-compose.yaml` does, set `LOG_PRETTY=false`
   to get JSON for a log collector. Anything that parses the old text
   log format needs to read JSON lines instead.
3. **Expect a log line per request.** At the default `LOG_LEVEL` of
   `info`, every request writes a line, including the Docker health
   check every 30 seconds. Raise `LOG_LEVEL` to `warn` if you only want
   failed requests.

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
