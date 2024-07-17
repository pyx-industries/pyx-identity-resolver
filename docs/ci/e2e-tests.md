# E2E Tests Workflow

## Overview

The E2E Tests workflow is responsible for running end-to-end tests
for the Identity Resolver Service (IDR) application.

## Trigger

This workflow is triggered on:

- Pull requests to the `next` and `master` branches

## Workflow Details

### Environment and Variables

- **Environment**: development
- **Node Version**: 21.x
- **Environment Variables**:
  - RESOLVER_DOMAIN
  - NODE_ENV (test)
  - OBJECT_STORAGE_ENDPOINT
  - OBJECT_STORAGE_PORT
  - OBJECT_STORAGE_USE_SSL
  - OBJECT_STORAGE_ACCESS_KEY (secret)
  - OBJECT_STORAGE_SECRET_KEY (secret)
  - OBJECT_STORAGE_BUCKET_NAME
  - OBJECT_STORAGE_PATH_STYLE
  - IDENTIFIER_PATH
  - API_KEY (secret)
  - APP_NAME

### Steps

1. **Checkout**: Fetches the repository code
2. **Install Node.js and Cache Dependencies**: Sets up Node.js and caches npm dependencies
3. **Install dependencies**: Installs npm dependencies for the app
4. **Start docker compose**: Starts the required Docker containers
5. **Run E2E tests**: Executes the end-to-end tests
6. **Stop docker compose**: Stops the Docker containers after tests complete

## Dependencies

- actions/checkout@v4
- actions/setup-node@v4
- Docker Compose

## Notes

- The workflow uses the `app/docker-compose.yaml` file to set up the required environment.
- Tests are run with the `--forceExit` flag to ensure the process terminates after all tests are complete.
- The workflow is designed to run in the `app` directory of the repository.
