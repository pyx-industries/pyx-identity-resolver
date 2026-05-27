# Release Management Guide

This document describes the release management strategy for the Pyx
Identity Resolver (IDR). The repository follows trunk-based development
on `master`; releases are cut by tagging from `master`.

---

## Table of Contents

1. [Release Overview](#release-overview)
2. [Branching](#branching)
3. [Versioning](#versioning)
4. [Version And Dependencies Management](#version-and-dependencies-management)
5. [Release Workflow](#release-workflow)

For the pipeline reference (Docker workflow triggers, image tag map),
see [CI/CD Pipeline](documentation/docs/deployment-guide/ci-cd.md).

---

## Release Overview

Each release combines a coordinated set of changes that have already
merged to `master` into a tagged version. The maintainer:

1. Confirms `master` is in a release-ready state (CI green, no in-flight
   breaking work).
2. Bumps `version.json` (and `app/package.json`) on a release-prep PR.
3. Updates `RELEASE_NOTES.md` with the human-facing entry for the new
   version and `CHANGELOG.md` with the technical entry.
4. Opens the release-prep PR, gets it reviewed, and merges it to
   `master`.
5. Tags the merge commit `v<X.Y.Z>` and pushes the tag.
6. The docker pipeline builds and pushes the release image. The release
   is identified by the git tag and the published Docker image;
   consumers browse `RELEASE_NOTES.md` at the tagged commit for the
   human-facing summary.

No `next`, `release/*`, or `hotfix/*` branches. All work flows through
PRs against `master`.

---

## Branching

- `master` is the only long-lived branch. It always reflects the latest
  agreed state of the project.
- Feature branches use `<conventional-type>/<short-kebab-case-description>`
  (e.g. `feat/add-some-endpoint`, `fix/handle-edge-case`). They merge to
  `master` via pull request.
- Hotfixes branch from the relevant release tag (`v<X.Y.Z>`), apply the
  fix, and produce a new patch tag (`v<X.Y.Z+1>`). There is no
  dedicated `hotfix/*` branch convention; the fix lands on a normal
  feature branch and goes through the same PR-to-`master` flow.

---

## Versioning

The project follows Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR** when the API contract breaks (e.g. removing a response
  field, changing a path shape).
- **MINOR** when backwards-compatible functionality is added.
- **PATCH** for backwards-compatible bug fixes.

Pre-release identifiers may be appended for staged rollouts:

- `v<X.Y.Z>-rc.<n>` for release candidates.
- `v<X.Y.Z>-alpha.<n>` and `-beta.<n>` for earlier-stage previews.
- `v<X.Y.Z>-pre.<n>` for ad-hoc pre-release builds.

Pre-release tags push the semver-tagged Docker image but do not move
the `:latest` pointer, so a pre-release does not become the default
pull target. Consumers browse `RELEASE_NOTES.md` at the tagged commit
for the human-facing release summary.

### API Version And Repository Version

The `apiVersion` field in `version.json` records the API contract
version as `MAJOR.MINOR`. The MAJOR of `apiVersion` is kept in lockstep
with the URL path's `v<MAJOR>` segment (`/api/v<MAJOR>`, derived from
`app/src/common/utils/config.utils.ts`). MINOR bumps document
backwards-compatible additions to the API surface and do not change the
URL.

When the API has a breaking change, both the repository MAJOR
(`version`) and the API MAJOR (`apiVersion`) move together.

See [ADR 002](docs/adr/002-major-only-api-url-versioning.md) for the
rationale.

### Documentation Versioning

`docVersion` in `version.json` tracks the Docusaurus snapshot version
independently of `version`. Generate a new documentation snapshot when
shipping user-visible documentation changes.

---

## Version And Dependencies Management

### Overview

`version.json` is a small metadata file at the repository root that
records:

- The current service `version` (must match the git tag and
  `app/package.json`).
- The `apiVersion` describing the API contract.
- The `docVersion` describing the documentation snapshot version.
- A `dependencies` map listing compatible versions of dependent
  services (optional).

### Example Structure

```json
{
  "version": "MAJOR.MINOR.PATCH",
  "apiVersion": "MAJOR.MINOR",
  "docVersion": "MAJOR.MINOR.PATCH",
  "dependencies": {}
}
```

### Bump Rules

| Change | `version` (semver) | `apiVersion` (MAJOR.MINOR) | `docVersion` |
|---|---|---|---|
| Bug fix, no API surface change | PATCH bump | unchanged | unchanged unless docs change |
| New optional field or endpoint (additive, backwards-compatible) | MINOR bump | MINOR bump | bump if user-visible docs change |
| Removing a field, changing a path, semantic break | MAJOR bump | MAJOR bump | bump if user-visible docs change |
| Docs-only change | PATCH or no bump | unchanged | bump if user-visible docs change |

---

## Release Workflow

### Cutting a regular release

1. Open a `chore/release-vX.Y.Z` branch from `master`.
2. Bump `version.json` (`version`, `apiVersion`, `docVersion` per the
   rules above) and `app/package.json` `version`.
3. Add the human-facing entry to `RELEASE_NOTES.md` (the operator's
   summary of what changed and why) and the technical entry to
   `CHANGELOG.md` (the engineering changelog).
4. Open a PR titled `chore(release): vX.Y.Z`, get it reviewed, and
   merge to `master`.
5. From a fresh checkout of `master` at the merge commit, tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

6. The docker pipeline picks up the tag push and builds the release
   image at `ghcr.io/pyx-industries/pyx-identity-resolver:X.Y.Z`. The
   `:latest` pointer moves to the new image (for non-pre-release tags
   only).

### Cutting a pre-release

Same as a regular release, with the pre-release suffix on the tag:

```bash
git tag vX.Y.Z-rc.1
git push origin vX.Y.Z-rc.1
```

The pipeline pushes `ghcr.io/.../pyx-identity-resolver:X.Y.Z-rc.1` and
does **not** move `:latest`. Operators opt in to the pre-release by
pulling the specific tag.

### Cutting a hotfix

1. Branch from the affected release tag:

   ```bash
   git checkout -b fix/<short-description> vX.Y.Z
   ```

2. Apply the fix, open a PR targeting `master`, get it reviewed, merge.
3. From the merge commit, tag and push the new patch:

   ```bash
   git tag vX.Y.Z+1
   git push origin vX.Y.Z+1
   ```

If the hotfix is also relevant to older release lines, cherry-pick the
commit onto branches based at those tags and tag patch releases there
too.