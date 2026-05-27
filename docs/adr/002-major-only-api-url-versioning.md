# ADR 002: Major-only API URL versioning with base-URL `RESOLVER_DOMAIN`

- **Date:** 2026-05-28
- **Status:** accepted

## Context

The Pyx Identity Resolver (IDR) emits URLs in three places that need to stay stable across releases:

1. Linkset `anchor` URLs and link-target `href` values returned in resolution responses.
2. The `Link` response header attached to every resolution.
3. The Swagger `server` URL exposed at `/api-docs` (used by the "Try it out" UI).

These URLs are constructed from the deployment's externally-reachable base URL plus the application's API route prefix. Two adjacent decisions shape that construction:

1. **What goes in the URL path version segment?** v3 and earlier used the full semver (`/api/3.0.0/`). Every patch release of the service therefore changed the URL path, invalidating every pre-stored linkset anchor and forcing clients to update their base URLs. The v2 migration guide already documents this rot ("Linkset metadata for existing identifiers", §migration-guides/v2). The cascade is: bump patch → URL path changes → stored anchors stale → consumers must wait for documents to be re-touched (or rebuild manually) → client base URLs require updates → release churn.

2. **What goes in `RESOLVER_DOMAIN`?** v3 expected the env var to contain the full URL up to and including the version path (`https://resolver.example.com/api/3.0.0`). This couples operator configuration to the URL-path-versioning decision: every bump requires the operator to update the env var even though the path is determined by the service itself. It also duplicates information already encoded in `apiVersion`.

Major-only URL versioning combined with a separate base-URL deployment variable is the dominant industry pattern (GitHub, Stripe, Twilio, AWS, Slack, and Discord all use major-only URL paths). It removes the per-patch URL churn, separates "operator configuration of where the service lives" from "service configuration of which API version it speaks", and lines up with how breaking and non-breaking changes are typically expressed.

## Decision

Two coupled changes, taken together:

### 1. URL path uses the major component of `apiVersion` only

`apiVersion` in `version.json` is stored as `MAJOR.MINOR` (for example `"4.0"`). The application derives `APP_ROUTE_PREFIX = '/api/v' + MAJOR(apiVersion)`. The MINOR component of `apiVersion` documents backwards-compatible additions to the API surface and is informational at runtime; it does not appear in URLs.

Bump `apiVersion` MAJOR only when the API contract breaks (path removed, response field changed, etc.). Patch and minor service releases (which release-please used to drive automatically) reuse the same `apiVersion` and therefore the same URL path. Stored linkset anchors survive non-breaking releases entirely.

### 2. `RESOLVER_DOMAIN` is the externally-reachable base URL only

`RESOLVER_DOMAIN` is the host (scheme + authority) of the externally-reachable deployment, with no trailing slash and no path. The application appends `APP_ROUTE_PREFIX` when composing full URLs.

```
RESOLVER_DOMAIN=https://resolver.example.com
APP_ROUTE_PREFIX=/api/v4         (derived from apiVersion="4.0")
constructed URL=${RESOLVER_DOMAIN}${APP_ROUTE_PREFIX}/...
                = https://resolver.example.com/api/v4/...
```

The slash sits at the front of `APP_ROUTE_PREFIX`, not on `RESOLVER_DOMAIN`, so callers do not have to defensively trim trailing slashes.

The same `RESOLVER_DOMAIN` value drives the Swagger `addServer(...)` URL so the "Try it out" feature in `/api-docs` hits the publicly-reachable host, not the internal container address. The previous separate `API_BASE_URL` variable is removed; one source of truth for the deployment's external URL.

The link-type vocabulary base is derived as `${RESOLVER_DOMAIN}${APP_ROUTE_PREFIX}/voc` and can be overridden on a per-identifier basis by setting `namespaceURI` on the identifier record. There is no env-var override; the per-identifier mechanism is the intended escape hatch for publishers hosting their vocabulary on a different domain.

## Consequences

### Positive

- **Stored linkset anchors survive patch and minor releases.** Documents only need rebuilding on MAJOR API bumps, which are rare by construction.
- **Operators stop encoding the URL version in `RESOLVER_DOMAIN`.** The env var stays stable across service releases; only `apiVersion` (controlled by the service maintainers) moves.
- **Swagger "Try it out" works behind reverse proxies** because the Swagger server URL is derived from the same `RESOLVER_DOMAIN` operators already set, not a separate env var that drifts out of sync.
- **One source of truth** for the deployment's external base URL. `API_BASE_URL` is removed.
- **Industry alignment**: GitHub (`/v3/`, `/v4/`), Stripe (`/v1/`), Twilio (`/v2/`), AWS (`/2012-10-17/`), Slack (`/api/`), Discord (`/api/v10/`) all use major-only URL paths.

### Negative / costs

- **Breaking change for any operator on v3 or earlier.** v4 upgrade requires:
  - Updating `RESOLVER_DOMAIN` to drop the trailing `/api/3.0.0` segment.
  - Removing any `API_BASE_URL` env var if previously set (no replacement; `RESOLVER_DOMAIN` covers both roles).
- **Breaking change for any client that hardcoded the URL.** Clients calling `/api/3.0.0/...` must update to `/api/v4/...`. Same effort as any other version bump, just to a different shape.
- **Stored linkset anchors from v3 are stale after upgrade.** The v4 data migration (#109) rebuilds them with the new `RESOLVER_DOMAIN${APP_ROUTE_PREFIX}` composition. No additional operator action beyond running the migration.
- **`docVersion` in `version.json` stays as full semver** (independent of `apiVersion`). Operators need to be aware the two version fields move on different cadences.

### Neutral

- Pre-release tags (`vX.Y.Z-rc.N`, `-alpha.N`, `-beta.N`, `-pre.N`) follow the standard semver pre-release grammar on the repository `version`, not on `apiVersion`. Pre-releases of a single API major reuse the same URL path.

## Alternatives considered

### Full semver in URL path (status quo)

`/api/3.0.0/`, `/api/3.0.1/`, etc. Rejected because patch and minor releases (which by definition don't break the API contract) still invalidate stored URLs and force operator action. The v2 migration guide already documents the rot this causes; perpetuating it serves no purpose.

### Major-only in `apiVersion` directly (`apiVersion: "v4"`)

Storing `"v4"` (literally) in `version.json` and using it as the path prefix unchanged. Rejected because:

1. `MAJOR.MINOR` lets the MINOR component document backwards-compatible additions to the API surface without changing the URL. A bare major loses that signal.
2. The "v" prefix is a URL convention, not a property of the API contract. Mixing them in one field couples the two concerns.

### Separate `PROTOCOL` / `DOMAIN` / `PORT` env triple

Splitting the base URL across three env vars (e.g. `PROTOCOL=http`, `DOMAIN=localhost`, `PORT=3333`) and having the application compose the URL itself. Rejected for IDR because the existing single-var pattern is already familiar to operators and a single var is one fewer thing to keep in sync. The split is reconsiderable if a future need (e.g. separate internal/external ports) makes it worth the extra surface.

## References

- Migration guide `documentation/docs/migration-guides/v4.md` — operator instructions for the upgrade.
- ADR 001 — link target variants as capability advertisement.
