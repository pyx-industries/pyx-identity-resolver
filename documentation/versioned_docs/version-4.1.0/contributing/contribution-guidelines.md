---
sidebar_position: 3
title: Contribution Guidelines
---

# Contribution Guidelines

Thank you for your interest in contributing to the Pyx Identity Resolver!
This guide covers the conventions and workflows
you should follow when contributing to the project.

## Semantic line breaks

This project uses [Semantic Line Breaks](https://sembr.org/)
in all documentation and Markdown files.
Rather than wrapping lines at a fixed column width,
you break lines at natural language boundaries --
typically after sentences, clauses, or logical phrases.

**Why?** Semantic line breaks make diffs cleaner and easier to review.
When you change a single sentence,
only that line shows up in the diff
rather than a reflowed paragraph.

For example:

```markdown
<!-- Good: semantic line breaks -->
The application uses MinIO for object storage.
Each identifier scheme is stored as a separate object,
and link sets are built from active responses only.

<!-- Avoid: long unbroken lines -->
The application uses MinIO for object storage. Each identifier scheme is stored as a separate object, and link sets are built from active responses only.
```

## Branching strategy

### Branch naming

Use the following prefixes for your branches:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features or enhancements | `feature/link-management-crud` |
| `fix/` | Bug fixes | `fix/linkset-content-type` |
| `hotfix/` | Critical production fixes | `hotfix/1.2.1` |
| `release/` | Release preparation | `release/1.2.0` |
| `docs/` | Documentation-only changes | `docs/contributing-guide` |
| `refactor/` | Code refactoring | `refactor/storage-adapter` |
| `test/` | Test additions or improvements | `test/e2e-link-resolution` |
| `chore/` | Maintenance tasks | `chore/upgrade-nestjs` |
| `infra/` | Infrastructure or CI changes | `infra/package-pipeline` |

### Pull request workflow

1. Create your branch from `master`.
2. Make your changes, committing in logical chunks.
3. Push your branch and open a pull request against `master`.
4. Ensure all CI checks pass (tests, lint, format, docs build).
5. Request a review from a team member.
6. Address any feedback, then merge once approved.

### PR title format

Pull request titles are validated by the
**Lint Commit Messages** workflow
using [`amannn/action-semantic-pull-request`](https://github.com/amannn/action-semantic-pull-request)
and must follow the
[Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description
```

Allowed types:

| Type | Purpose |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code restructuring without changing behaviour |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or dependency changes |
| `ci` | CI/CD configuration changes |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |

Examples:

```
feat(link-registration): add link management CRUD endpoints
fix(link-resolution): correct content type for linkset response
docs: update contributing guide
test(identifier-management): add edge case coverage for validation
```

## Code style and conventions

### Language and framework

The application is built with [NestJS](https://nestjs.com/)
(a Node.js framework) using TypeScript.
Tests use [Jest](https://jestjs.io/).

### Formatting and linting

The project uses **Prettier** for formatting
and **ESLint** for linting.
A `lint-staged` configuration runs both tools
on staged files via a Husky pre-commit hook.

Before pushing, you can run these checks manually:

```bash
cd app

# Check formatting
npm run format:check

# Auto-format files
npm run format

# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

### Commit messages

Local commits are validated by [commitlint](https://commitlint.js.org/)
via a Husky commit-msg hook.
Use the Conventional Commits format:

```
type(scope): description
```

Keep commits focused --
group related changes together in a single commit.
For example, a feature and its tests belong in the same commit,
not split across separate ones.

### Breaking changes

If a commit introduces a breaking change --
for example, removing an endpoint, renaming an environment variable,
or changing request/response schemas --
add a `BREAKING CHANGE:` footer to the commit body:

```
feat(link-resolution)!: remove legacy redirect mode

BREAKING CHANGE: The `legacyRedirect` query parameter has been removed.
Clients relying on this parameter must update to use the standard
resolution flow.
```

The `!` after the type/scope is a shorthand marker
that signals a breaking change in the commit subject.
The `BREAKING CHANGE:` footer provides a description of what changed
and what consumers need to do.

Breaking changes trigger a **major version bump**
under semantic versioning.

## Testing requirements

All modified and new functionality **must** have tests.
The CI pipeline enforces a minimum coverage threshold of **80%**
across branches, functions, lines, and statements.

### What needs tests

| Change | Testing requirement |
|--------|-------------------|
| New feature or module | Unit tests covering core logic and edge cases |
| Bug fix | A regression test that would have caught the bug |
| Modified behaviour | Updated existing tests plus new tests for changed behaviour |
| New utility function | Unit tests covering happy path and edge cases |
| Refactoring | Existing tests must still pass; add tests if coverage gaps exist |

### Running tests

All test commands are run from the `app/` directory.
For full setup instructions,
see the [Development Setup](./index.md#running-tests) page.

```bash
# Unit tests
npm test

# Unit tests in watch mode
npm run test:watch

# Unit tests with coverage report
npm run test:cov

# E2E tests (requires Docker Compose running)
npm run test:e2e -- --forceExit
```

### E2E tests

:::info
End-to-end tests require a running MinIO instance and a running application server.
The simplest approach is to start both with Docker Compose.
:::

```bash
docker compose up -d
cd app
npm run test:e2e -- --forceExit
```

E2E test specs live in `app/test/`
and use a separate Jest configuration (`app/test/jest-e2e.json`).
For more detail on running tests,
see the [Development Setup](./index.md#end-to-end-tests) page.

## Documentation contributions

The documentation site is built with
[Docusaurus](https://docusaurus.io/)
and lives in the `documentation/` directory.

### Local development

```bash
cd documentation
yarn install
yarn start
```

This starts a local server with hot reload.

### Building

```bash
yarn build
```

The CI pipeline builds the documentation on every pull request,
so build failures will block your PR.

### Documentation versioning

The documentation site supports versioned snapshots.
You generally don't need to worry about versioning --
just edit the files in `documentation/docs/`.
Versioned snapshots are created as part of the
[release process](./release-process.md#documentation-versioning)
when the `docVersion` is bumped.


