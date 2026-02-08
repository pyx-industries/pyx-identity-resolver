---
sidebar_position: 2
title: Release Process
---

# Release Process

This is the canonical guide for releasing a new version
of the Pyx Identity Resolver.
It covers versioning, the step-by-step release workflow,
documentation versioning, hotfixes, and troubleshooting.

## Versioning scheme

The project follows [Semantic Versioning](https://semver.org/)
using the format **MAJOR.MINOR.PATCH**:

| Increment | When to use | Example |
|-----------|-------------|---------|
| **MAJOR** | Incompatible or breaking changes | `1.1.0` to `2.0.0` |
| **MINOR** | New features, backward-compatible | `1.0.2` to `1.1.0` |
| **PATCH** | Backward-compatible bug fixes | `1.0.1` to `1.0.2` |

### API version alignment

When the API contract changes,
the repository version must be bumped to match:

- **PATCH** API change requires a **PATCH** repository bump.
- **MINOR** API change requires a **MINOR** repository bump
  (and updated Swagger documentation).
- **MAJOR** API change requires a **MAJOR** repository bump
  (and updated Swagger documentation).

Always keep the API version and repository version in sync
to avoid confusion for integrators.

## The version file

The `version.json` file in the repository root
is the single source of truth for version metadata:

```json
{
  "version": "1.1.3",
  "apiVersion": "1.0.0",
  "docVersion": "1.1.1",
  "dependencies": {}
}
```

| Field | Purpose | When to update |
|-------|---------|----------------|
| `version` | The release version of the application. Must match the Git tag. | **Every release** -- always set to the new release version. |
| `apiVersion` | The version of the API contract. | Only when the API contract changes (new endpoints, changed request/response shapes, breaking changes). |
| `docVersion` | The version of the documentation snapshot. | Only when documentation has been added or changed. |
| `dependencies` | Compatible versions of dependent services. | When dependency compatibility changes. |

### Where else to update versions

When preparing a release, you need to update versions in multiple places:

| File | Field | When to update |
|------|-------|----------------|
| `version.json` | `version` | Every release |
| `version.json` | `apiVersion` | If the API contract changed |
| `version.json` | `docVersion` | If documentation changed |
| `app/package.json` | `version` | Every release -- must match `version.json` `version` |
| `documentation/package.json` | `version` | If documentation changed -- must match `version.json` `docVersion` |

## Release workflow

### Pre-release checklist

Before starting, confirm that:

- [ ] All feature branches for this release have been merged to `master`.
- [ ] All unit, integration, and end-to-end tests pass.
- [ ] Any new or changed functionality has corresponding documentation.

### Step-by-step

**1. Create a release branch**

Branch from `master` using the naming convention `release/<version>`:

```bash
git checkout master
git pull origin master
git checkout -b release/1.2.0
```

:::note Special case: cherry-picking
If you need to release only specific commits
rather than everything on `master`,
create the branch from the last release tag
and cherry-pick the required commits.
:::

**2. Bump version numbers**

:::warning
Make sure the version in `app/package.json`
matches the `version` field in `version.json`.
A mismatch will cause confusion during packaging and deployment.
:::

Update the version in the following files:

- `version.json` -- set `version` to the new release number.
  Update `apiVersion` and `docVersion` if applicable.
- `app/package.json` -- set `version` to match.
- `documentation/package.json` -- update to match `docVersion` if documentation changed.

**3. Generate a documentation version snapshot (if docs changed)**

If the `docVersion` was updated, create a versioned snapshot of the documentation:

```bash
cd documentation
yarn release:doc
```

This runs `docusaurus docs:version <docVersion>`,
which creates a frozen copy of the current docs
under `documentation/versioned_docs/`.

**4. Push the release branch**

```bash
git add .
git commit -m "chore(release): prepare release 1.2.0"
git push origin release/1.2.0
```

**5. Merge the auto-generated changelog PR**

When you push to a `release/*` branch,
the changelog pipeline automatically generates a changelog
and opens a pull request against your release branch.
Review it and merge it into the release branch.

**6. Create a pull request to master**

Open a PR from `release/1.2.0` to `master`.
The PR must:

- Pass the **Test Build** pipeline (unit tests, lint, format, build, and docs build).
- Pass the **E2E Tests** pipeline.
- Have no merge conflicts.
- Include a migration guide if there are breaking changes.
- Be approved by a team member.

**7. Merge to master**

Once approved, merge the PR.
The release pipeline automatically:

1. Runs tests and builds the application.
2. Reads the version from `version.json`.
3. Creates a Git tag (e.g. `1.2.0`).
4. Creates a GitHub Release with notes extracted from the changelog.

**8. Verify the release**

After the pipeline completes, confirm:

- [ ] The Git tag exists on `master`.
- [ ] The GitHub Release was created with correct release notes.
- [ ] Docker images were built and pushed to
  [GitHub Container Registry](https://github.com/pyx-industries/pyx-identity-resolver/pkgs/container/pyx-identity-resolver)
  (triggered by the package pipeline when the tag is created).

## Documentation versioning

The documentation site uses Docusaurus versioning
to maintain snapshots of docs for each release.

### How it works

- The `documentation/docs/` directory contains the **current (next)** documentation.
- When you run `yarn release:doc`,
  the `release-doc.js` script reads `docVersion` from `version.json`
  and runs `docusaurus docs:version <docVersion>`.
- This creates a frozen copy under `documentation/versioned_docs/version-<docVersion>/`.
- The `documentation/package.json` `version` field
  should match the `docVersion` in `version.json`.

### When to create a new doc version

Create a new documentation version only when documentation content has changed.
If a release contains only code changes with no documentation updates,
skip the `yarn release:doc` step
and leave `docVersion` unchanged.

## Hotfix releases

For critical bugs or security issues
that need to be released outside the normal cycle:

1. Create a `hotfix/*` branch from `master`:

```bash
git checkout master
git pull origin master
git checkout -b hotfix/1.2.1
```

2. Make the necessary changes and commit them.

3. Bump the **patch** version in `version.json` and `app/package.json`.

4. Push the branch.
   Merge the auto-generated changelog PR into the hotfix branch.

5. Create a PR from `hotfix/1.2.1` to `master`.

6. Get approval and merge.
   The release pipeline handles tagging and publishing automatically.

## CI/CD pipelines

The project uses several GitHub Actions workflows
to automate testing, quality checks, and the release process.
For a broader overview of the CI/CD architecture,
see the [CI/CD Pipeline](../deployment-guide/ci-cd.md) page
in the Deployment Guide.

### Test Build pipeline (`test_build.yml`)

**Trigger:** Pull requests targeting `master` or `next`.

Runs the following checks on every PR:

1. Format check (`npm run format:check`).
2. Lint (`npm run lint`).
3. Application build (`npm run build`).
4. Unit tests with coverage (`npm run test -- --ci --coverage`).
5. Documentation build (in a separate job).

### E2E Tests pipeline (`e2e_tests.yml`)

**Trigger:** Pull requests targeting `master` or `next`.

Starts MinIO and the application via Docker Compose,
then runs the full end-to-end test suite
(`npm run test:e2e -- --forceExit`).

### Changelog pipeline

**Trigger:** Push to `release/*` or `hotfix/*` branches.

Automatically generates a changelog
using [release-please](https://github.com/googleapis/release-please-action)
and opens a PR against the release or hotfix branch.

### Release pipeline

**Trigger:** Push to `master` (typically from merging a release or hotfix PR).

1. Runs tests and builds the application.
2. Reads the version from `version.json`.
3. Checks whether the tag already exists (skips if it does).
4. Creates a Git tag and pushes it.
5. Creates a GitHub Release with notes from the changelog.

### Package pipeline (`package.yml`)

**Triggers:**

- A semver tag is pushed (e.g. `1.2.0`).
- The **Release** workflow completes successfully (`workflow_run`).
- Manual dispatch (`workflow_dispatch`).

1. Builds two Docker images: standard and serverless.
2. Pushes both to GitHub Container Registry
   with appropriate tags (`<version>`, `<version>-serverless`, SHA, etc.).
3. Both images support `linux/amd64` and `linux/arm64` architectures.

### Documentation pipeline (`build_publish_docs.yml`)

**Trigger:** Push to `master` when files under `documentation/` change,
or manual dispatch.

Builds the Docusaurus documentation site
and deploys it to GitHub Pages.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Release pipeline didn't trigger** | Check that the merge target is `master` and the workflow is enabled. |
| **Tag not created** | The tag may already exist from a previous attempt. Check with `git ls-remote --tags origin`. If a duplicate exists, you'll need to delete it or bump the version. |
| **Changelog PR not generated** | Ensure you pushed to a `release/*` or `hotfix/*` branch. The pipeline skips commits that look like release-please merges. |
| **Docker images not published** | The package pipeline triggers on tags. Verify the tag was created and pushed successfully. |
| **Tests failed during release** | Fix the issue on the release branch, push again, and re-merge. The release pipeline re-runs on each push to `master`. |
