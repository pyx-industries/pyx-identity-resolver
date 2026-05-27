---
sidebar_position: 2
title: Release Process
---

# Release Process

This is the canonical guide for releasing a new version of the Pyx
Identity Resolver. It covers versioning, the step-by-step release
workflow, documentation versioning, hotfixes, and troubleshooting.

The repository follows **trunk-based development on `master`**;
releases are cut by tagging from `master`. There is no `next` branch,
no `release/*` branch, and no `hotfix/*` branch convention.

For the maintainer-facing summary, see also
[`RELEASE_MANAGEMENT_GUIDE.md`](https://github.com/pyx-industries/pyx-identity-resolver/blob/master/RELEASE_MANAGEMENT_GUIDE.md)
in the repository root.

## Versioning scheme

The project follows [Semantic Versioning](https://semver.org/) using
the format **MAJOR.MINOR.PATCH**:

| Increment | When to use | Example |
|-----------|-------------|---------|
| **MAJOR** | Incompatible or breaking changes | `3.0.1` to `4.0.0` |
| **MINOR** | New features, backward-compatible | `4.0.0` to `4.1.0` |
| **PATCH** | Backward-compatible bug fixes | `4.1.0` to `4.1.1` |

Pre-release identifiers may be appended for staged rollouts:

- `vX.Y.Z-rc.N` for release candidates.
- `vX.Y.Z-alpha.N` and `-beta.N` for earlier-stage previews.
- `vX.Y.Z-pre.N` for ad-hoc pre-release builds.

Pre-release tags push the semver-tagged Docker image but do **not**
move the `:latest` pointer, so a pre-release does not become the
default pull target.

### API version alignment

`version.json` records three version fields that move on different
cadences:

| Field | Format | Bumps when |
|-------|--------|------------|
| `version` | semver `MAJOR.MINOR.PATCH` | Every release; matches the git tag and `app/package.json`. |
| `apiVersion` | `MAJOR.MINOR` | The API contract changes. MAJOR drives the URL path (`/api/v<MAJOR>`); MINOR documents backwards-compatible additions. |
| `docVersion` | semver `MAJOR.MINOR.PATCH` | User-visible documentation changes ship. |

The MAJOR of `apiVersion` is in lockstep with the URL path. A
backwards-compatible API addition bumps `apiVersion` MINOR but does
**not** change the URL. A breaking API change bumps both `apiVersion`
MAJOR and the repository `version` MAJOR together. See
[ADR 002](https://github.com/pyx-industries/pyx-identity-resolver/blob/master/docs/adr/002-major-only-api-url-versioning.md)
for the rationale.

## Cutting a regular release

1. Open a `chore/release-vX.Y.Z` branch from `master`.
2. Bump the relevant fields in `version.json` (using the table above)
   and the `version` field in `app/package.json` so it matches
   `version.json`.
3. Add the human-facing entry to `RELEASE_NOTES.md` (operator's
   summary of what changed and why) and the technical entry to
   `CHANGELOG.md` (engineering changelog).
4. Open a PR titled `chore(release): vX.Y.Z`. Get it reviewed and
   merge to `master`.
5. From a fresh checkout of `master` at the merge commit, tag and
   push:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

6. The `docker.yml` pipeline picks up the tag push and builds the
   release image at
   `ghcr.io/pyx-industries/pyx-identity-resolver:X.Y.Z`. The `:latest`
   pointer moves to the new image (non-pre-release tags only).

## Cutting a pre-release

Same as a regular release, with the pre-release suffix on the tag:

```bash
git tag vX.Y.Z-rc.1
git push origin vX.Y.Z-rc.1
```

The pipeline pushes
`ghcr.io/pyx-industries/pyx-identity-resolver:X.Y.Z-rc.1` and does
**not** move `:latest`. Operators opt in to the pre-release by pulling
the specific tag.

## Cutting a hotfix

1. Branch from the affected release tag:

   ```bash
   git checkout -b fix/<short-description> vX.Y.Z
   ```

2. Apply the fix, open a PR targeting `master`, get it reviewed,
   merge.
3. From the merge commit, tag and push the new patch:

   ```bash
   git tag vX.Y.Z+1
   git push origin vX.Y.Z+1
   ```

If the hotfix is also relevant to older release lines, cherry-pick the
commit onto branches based at those tags and tag patch releases there
too.

## Documentation versioning

`docVersion` in `version.json` tracks the Docusaurus snapshot version
independently of the service `version`. Generate a new snapshot when
shipping user-visible documentation changes by running the docs site's
own versioning command and bumping `docVersion`.

## Troubleshooting

| Symptom | Likely cause | Resolution |
|---------|--------------|------------|
| Tag push didn't trigger the docker pipeline | Tag pattern mismatch | Confirm the tag matches `v*`. |
| `:latest` didn't move after a tag push | Tag is a pre-release (contains `-rc`, `-alpha`, `-beta`, or `-pre`) | Expected. Pre-releases never move `:latest`. |
| Two versions in `version.json` and `app/package.json` disagree | Bump step missed a file | Re-run the release-prep PR with both files in sync. |
| URL path didn't change after a MINOR API bump | Expected behaviour | The URL path is derived from `apiVersion` MAJOR only. MINOR bumps document additions without changing routes. |
