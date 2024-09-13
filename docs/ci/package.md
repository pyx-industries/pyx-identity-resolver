# Package Workflow

## Overview

The Package workflow is responsible for building and pushing Docker images
for the Identity Resolver Service (IDR) application.

## Trigger

This workflow is triggered on:

- Push of tags matching the pattern "v*.*.\*" (e.g., v1.0.0)
- Manual trigger via workflow_dispatch
- Completion of the 'Release Tagging' workflow

## Workflow Details

### Environment Variables

- CI: true

### Steps

1. **Checkout**: Fetches the repository code
2. **Docker meta details**: Extracts metadata for Docker images
3. **Set up Docker**: Prepares the Docker buildx environment
4. **Login to Github Container Registry**: Authenticates with GitHub Container Registry
5. **Build and Push Local Image**: Builds and pushes the local version of the Docker image
6. **Build and Push Serverless Image**: Builds and pushes the serverless version of the Docker image (used for deployment)

## Dependencies

- actions/checkout@v4
- docker/metadata-action@v5
- docker/setup-buildx-action@v3
- docker/login-action@v3
- docker/build-push-action@v5

## Notes

- The workflow builds two versions of the Docker image: local and serverless
- Images are tagged with version numbers, latest (for master branch), and commit SHA
- Images are only pushed to the registry when the workflow is triggered by a tag push
- The workflow uses the `app/Dockerfile` for the local image
  and `app/Dockerfile.serverless` for the serverless image
