# Release Tagging Workflow

## Overview

The Release Tagging workflow automates the process of creating new release tags
and GitHub Releases for the Identity Resolver Service (IDR) application.

## Trigger

This workflow is triggered on:

- Push to the `master` branch

## Workflow Details

### Steps

1. **Checkout code**: Fetches the repository code
2. **Get version from package.json**: Extracts the version number from the app's package.json file
3. **Check if tag already exists**: Verifies if a tag for the current version already exists
4. **Create and push tag**: If the tag doesn't exist, creates a new tag and pushes it to the repository
5. **Create GitHub Release**: Creates a new GitHub Release for the new tag

## Dependencies

- actions/checkout@v4
- ncipollo/release-action@v1

## Notes

- The workflow reads the version number from the `app/package.json` file
- It only creates a new tag and release if a tag for the current version doesn't already exist
- The GitHub Release is created with automatically generated release notes
- The release is not marked as a pre-release
