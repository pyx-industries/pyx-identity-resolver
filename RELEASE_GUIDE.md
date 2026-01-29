# RELEASE GUIDE

This document provides a step-by-step guide for preparing, releasing, and deploying a new version of the application.

---

## Table of Contents

1. [Pre-Release Checklist](#pre-release-checklist)
2. [Version Bumping](#version-bumping)
3. [Documentation](#documentation)
4. [Post-Release Steps](#post-release-steps)
5. [Hotfix Release](#hotfix-release)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Release Checklist

Before starting the release process, ensure:

- [ ] All pull requests for the release are merged to `master` branch.
- [ ] Create `release/*` branch from `master` branch.
- [ ] Update version and dependencies following the steps in [Version Bumping](#version-bumping).
- [ ] If documentation was updated, generate new version using `yarn release:doc` in the documentation folder.
- [ ] All unit, integration, and end-to-end tests pass.
- [ ] Merge the auto-generated changelog PR into the `release/*` branch.
- [ ] Create a PR for the `release/*` branch to `master` branch.
- [ ] Get approval from the team.
- [ ] Merge the PR to `master` branch.
- [ ] Verify the release pipeline creates the tag and GitHub release automatically.
- [ ] Verify the package pipeline builds and pushes Docker images.
- [ ] Relevant stakeholders are informed.

---

## Version Bumping

1. Determine the new version number based on [Semantic Versioning](https://semver.org/):

   - Patch: Bug fixes (e.g., 1.0.1 → 1.0.2)
   - Minor: New features, backward-compatible (e.g., 1.0.2 → 1.1.0)
   - Major: Breaking changes (e.g., 1.1.0 → 2.0.0)

2. Update the version in:
   - `app/package.json` - update the `version` field.
   - `version.json`:
     - `version` - always update to match the release version.
     - `apiVersion` - only update if the API contract changes.
     - `docVersion` - only update if documentation was changed.
   - Make sure all dependencies in `package.json` are up-to-date and compatible with the new version.

---

## Documentation

Ensure that any new functionality or changes to existing functionality have corresponding documentation before the release. Documentation should be updated as part of the feature development process, not deferred to the release.

If documentation has been updated, generate a new versioned snapshot using:

```bash
cd documentation
yarn release:doc
```

---

## Post-Release Steps

- [ ] Verify the tag was created on the `master` branch.
- [ ] Verify the Docker images were published to GHCR.
- [ ] Verify the GitHub release was created with release notes.

---

## Hotfix Release

In case of a critical bug or security issue, a hotfix release is required. Follow these steps:

1. Create a new branch from `master` branch with the name `hotfix/*`.
2. Make the necessary changes and commit them.
3. Update the version number in `app/package.json` and `version.json` files following the [Version Bumping](#version-bumping) steps.
4. Merge the auto-generated changelog PR into the `hotfix/*` branch.
5. Create a PR for the `hotfix/*` branch to `master` branch.
6. Get approval from the team.
7. Merge the PR to `master` branch.

---

## Troubleshooting

- **Build failed:** Check logs for errors in dependencies or configurations.
- **Tests failed:** Investigate the specific test cases and fix issues.
- **Release pipeline didn't trigger:** Ensure the workflow is configured to trigger on pushes to `master` branch.
- **Tag not created:** Check if the version in `version.json` already exists as a tag.
