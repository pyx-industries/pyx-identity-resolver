---
sidebar_position: 6
title: CI/CD Pipeline
---

# CI/CD Pipeline

The IDR uses [GitHub Actions](https://github.com/features/actions)
to automate testing, releasing, and Docker image publishing.
Two primary workflows handle the release lifecycle:

1. **Release** --- creates version tags and GitHub releases when code is merged to `master`.
2. **Package** --- builds multi-architecture Docker images and pushes them to the GitHub Container Registry (GHCR).

There are also supporting workflows for commit linting, E2E tests, and documentation publishing,
but the Release and Package workflows are the ones that matter most for deployment.

## Release workflow

**File**: `.github/workflows/release.yml`

### Triggers

| Event | Condition |
|-------|-----------|
| Push to `master` | Automatic --- runs on every merge to `master`. |
| Manual dispatch | Trigger from the Actions tab in GitHub. |

### What it does

The Release workflow runs in two jobs:

#### 1. `test_build`

Checks out the code, installs dependencies, lints, builds, and runs the test suite.
This ensures the codebase is healthy before any release artefacts are created.

#### 2. `release`

Once tests pass:

1. Reads the version from `version.json` at the repository root.
2. Checks whether a Git tag for that version already exists.
3. If the tag is new:
   - Creates an annotated Git tag (e.g. `2.0.0`).
   - Pushes the tag to the repository.
   - Extracts the relevant section from `CHANGELOG.md`
     and creates a **GitHub Release** with those notes.

If the tag already exists (e.g. a re-run after a failed Package build),
the release job is skipped gracefully.

### Version source of truth

The version is defined in `version.json`:

```json
{
  "version": "2.0.0",
  "apiVersion": "1.0.0",
  "docVersion": "1.1.1",
  "dependencies": {}
}
```

| Field | Purpose |
|-------|---------|
| `version` | The release version. Always updated for every release. This becomes the Git tag. |
| `apiVersion` | The API contract version. Only updated when the API surface changes. Used in the URL path (`/api/3.0.0`). |
| `docVersion` | The documentation version. Only updated when docs change. |

The project follows [Semantic Versioning](https://semver.org/):
- **Patch** (1.0.0 -> 1.0.1): backwards-compatible bug fixes.
- **Minor** (1.0.1 -> 1.1.0): new features, backwards-compatible.
- **Major** (1.1.0 -> 2.0.0): breaking changes.

## Package workflow

**File**: `.github/workflows/package.yml`

### Triggers

The Package workflow can be triggered in three ways:

| Event | Condition |
|-------|-----------|
| Tag push | Any tag matching `*.*.*` (i.e. a semver tag created by the Release workflow). |
| Workflow run | Automatically triggered when the **Release** workflow completes. The build job only proceeds if the Release run was successful. |
| Manual dispatch | Trigger manually from the Actions tab. Useful for re-running a failed build without creating a new release. |

:::info
In the most common flow,
a merge to `master` triggers the Release workflow,
which creates a Git tag.
The tag push then triggers the Package workflow.
The `workflow_run` trigger acts as a fallback
in case the tag-push event is missed.
:::

### What it does

The Package workflow builds and publishes Docker images:

1. Checks out the code and reads the version from `version.json`.
2. Generates Docker metadata (tags and labels) for both image variants.
3. Sets up QEMU and Docker Buildx for multi-platform builds.
4. Logs in to GHCR (`ghcr.io`).
5. Builds and pushes the **standard image** from `Dockerfile`.
6. Builds and pushes the **serverless image** from `Dockerfile.serverless`.

### Multi-architecture builds

Both images are built for:
- `linux/amd64` --- Intel/AMD servers (most cloud VMs).
- `linux/arm64` --- ARM servers (AWS Graviton, Oracle Ampere).

Docker automatically pulls the correct architecture
when you `docker pull` on a given host.

### Image variants

| Variant | Dockerfile | Image name | Use case |
|---------|-----------|------------|----------|
| Standard | `Dockerfile` | `ghcr.io/pyx-industries/pyx-identity-resolver` | Docker, Docker Compose, Kubernetes |
| Serverless | `Dockerfile.serverless` | `ghcr.io/pyx-industries/pyx-identity-resolver` (with `-serverless` suffix) | AWS Lambda container deployments |

## Image tagging conventions

Each build produces several tags.
Here's what each one means:

| Tag pattern | Example | When it's created | Recommended use |
|-------------|---------|-------------------|-----------------|
| `X.Y.Z` | `2.0.0` | On semver tag push | **Production** --- pin to a specific version. |
| `X.Y.Z-serverless` | `2.0.0-serverless` | On semver tag push | **Production Lambda** --- pin to a specific version. |
| `edge` | `edge` | On push to `master` | Testing the latest unreleased code. |
| `edge-serverless` | `edge-serverless` | On push to `master` | Testing the latest unreleased serverless build. |
| `sha-<hash>` | `sha-abc1234` | Every build | Debugging or pinning to an exact commit. |
| `sha-<hash>-serverless` | `sha-abc1234-serverless` | Every build | Debugging or pinning (serverless). |
| `latest` | `latest` | Automatically assigned to the newest semver tag | Convenience --- not recommended for production. |

:::tip
Pin to a specific `X.Y.Z` version tag in production.
The `edge` and `latest` tags move with every build or release
and may introduce unexpected changes.
:::

## Pulling images

### Standard image

```bash
# Specific version (recommended)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:2.0.0

# Latest from master
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:edge

# Exact commit
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:sha-abc1234
```

### Serverless image

```bash
# Specific version (recommended)
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:2.0.0-serverless

# Latest from master
docker pull ghcr.io/pyx-industries/pyx-identity-resolver:edge-serverless
```

## Supporting workflows

For completeness, here are the other workflows in the repository:

| Workflow | File | Purpose |
|----------|------|---------|
| PR Title Lint | `commitlint.yml` | Validates **pull request titles** follow the [Conventional Commits](https://www.conventionalcommits.org/) format using [`action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request). Runs on PRs targeting `master`. |
| Test Build | `test_build.yml` | Runs linting, build, and unit tests on pull requests. Also includes a `build_docs` job that builds the Docusaurus documentation site to catch broken docs early. |
| E2E Tests | `e2e_tests.yml` | Runs end-to-end tests against a running instance. |
| Changelog | `create-changelog.yml` | Auto-generates changelog entries on `release/*` and `hotfix/*` branches. |
| Documentation | `build_publish_docs.yml` | Builds and deploys the Docusaurus documentation site to GitHub Pages. |

## Next steps

- [Installation](./index.md) --- use the published images to deploy.
- [Serverless](./serverless) --- detailed Lambda deployment guide.
