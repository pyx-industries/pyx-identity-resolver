---
sidebar_position: 6
title: CI/CD Pipeline
---

# CI/CD Pipeline

The IDR uses [GitHub Actions](https://github.com/features/actions) to
automate testing and Docker image publishing. Releases follow a
**trunk-based, tag-driven flow**: maintainers cut releases by tagging
`master`; the docker pipeline picks up the tag and publishes the
image. There is no `next` branch, no `release/*` branch, and no
`hotfix/*` branch convention.

For the full maintainer-facing release workflow (when to bump
`version.json`, how to tag a release, how to ship a pre-release or a
hotfix), see [Release Process](../contributing/release-process).

## Docker workflow

**File**: `.github/workflows/docker.yml`

### Triggers

| Event | Behaviour |
|-------|-----------|
| Push to `master` (path-filtered to relevant files) | Pushes `:master` and `:master-<sha>` image tags. Tracks the trunk's latest state. |
| Push of a `v*` tag (e.g. `v4.0.0`, `v4.1.0-rc.1`) | Pushes the semver-tagged image. The `:latest` pointer moves only for non-pre-release tags. |
| `workflow_dispatch` with a `version` input | Equivalent to a tag push but triggered manually. Useful for republishing or ad-hoc tagging. |

### What it does

1. Checks out the code at the SHA that triggered the workflow (so a
   parallel push to `master` cannot move the working tree underneath
   the build).
2. Sets up QEMU and Docker Buildx for multi-architecture builds.
3. Logs in to GitHub Container Registry (`ghcr.io`).
4. Generates Docker metadata (image name + applicable tags) using
   `docker/metadata-action`.
5. Builds and pushes the image for `linux/amd64` and `linux/arm64`.

### Image variants

Every build produces two image variants, distinguished by suffix:

| Variant | Dockerfile | Suffix | Use case |
|---------|-----------|--------|----------|
| Standard | `Dockerfile` | none | Docker, Docker Compose, Kubernetes |
| Serverless | `Dockerfile.serverless` | `-serverless` | AWS Lambda container deployments |

### Image tag map

Each row below produces the listed standard tag plus a matching
`-serverless` tag (e.g. `4.0.0` and `4.0.0-serverless`).

| Trigger | Tag pattern | Example |
|---------|-------------|---------|
| Push to `master` | `master`, `master-<sha>` | `master`, `master-abc1234` |
| Push of release tag `vX.Y.Z` | `X.Y.Z`, `latest` (non-pre-release only) | `4.0.0`, `latest` |
| Push of pre-release tag `vX.Y.Z-rc.N` | `X.Y.Z-rc.N` (no `latest` move) | `4.0.0-rc.1` |
| `workflow_dispatch` with `version=X.Y.Z` | `X.Y.Z`, `latest` (non-pre-release only) | `4.0.0`, `latest` |

:::tip
Pin to a specific `X.Y.Z` version tag in production. The `master` and
`latest` tags move with every push or non-pre-release tag and may
introduce unexpected changes between deploys.
:::

### Pulling images

Standard image:

```bash
# Specific version (recommended for production)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:4.0.0

# Trunk's latest state
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:master

# Exact commit on master
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:master-abc1234

# Latest non-pre-release tag
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:latest
```

Serverless image (Lambda):

```bash
# Specific version
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:4.0.0-serverless

# Trunk's latest state
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:master-serverless

# Latest non-pre-release tag
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:latest-serverless
```

## Version source of truth

The release version lives in `version.json` at the repository root:

```json
{
  "version": "4.0.0",
  "apiVersion": "4.0",
  "docVersion": "4.0.0",
  "dependencies": {}
}
```

| Field | Purpose |
|-------|---------|
| `version` | The release version. Updated on every release; must match the git tag and `app/package.json`. |
| `apiVersion` | The API contract version (`MAJOR.MINOR`). MAJOR drives the URL path (`/api/v<MAJOR>`); MINOR documents backwards-compatible additions. |
| `docVersion` | The documentation snapshot version. Updated when user-visible docs change. |

The project follows [Semantic Versioning](https://semver.org/):

- **Patch** (`4.0.0 → 4.0.1`): backwards-compatible bug fixes.
- **Minor** (`4.0.0 → 4.1.0`): new features, backwards-compatible.
- **Major** (`4.0.0 → 5.0.0`): breaking changes.

See [ADR 002](https://github.com/pyx-industries/pyx-identity-resolver/blob/master/docs/adr/002-major-only-api-url-versioning.md)
for why `apiVersion` MAJOR drives the URL but MINOR doesn't.

## Supporting workflows

| Workflow | File | Purpose |
|----------|------|---------|
| PR Title Lint | `commitlint.yml` | Validates **pull request titles** follow the [Conventional Commits](https://www.conventionalcommits.org/) format using [`action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request). Runs on PRs targeting `master`. |
| Test Build | `test_build.yml` | Runs linting, build, and unit tests on pull requests. Also includes a `build_docs` job that builds the Docusaurus documentation site to catch broken docs early. |
| E2E Tests | `e2e_tests.yml` | Runs end-to-end tests against a running instance. |
| Documentation | `build_publish_docs.yml` | Builds and deploys the Docusaurus documentation site to GitHub Pages. |

## Next steps

- [Installation](./index.md) --- use the published images to deploy.
- [Serverless](./serverless) --- detailed Lambda deployment guide.
