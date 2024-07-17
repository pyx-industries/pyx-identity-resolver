# Test Build Workflow

## Overview

The Test Build workflow is responsible for running linting, tests, and building
the Identity Resolver Service (IDR) application for pull requests.

## Trigger

This workflow is triggered on:

- Pull requests to the `next` and `master` branches

## Workflow Details

### Steps

1. **Checkout**: Fetches the repository code
2. **Install Node.js and Cache Dependencies**: Sets up Node.js and caches npm dependencies
3. **Install dependencies**: Installs npm dependencies for the app
4. **Lint**: Runs the linter on the application code
5. **Build**: Builds the application
6. **Run tests**: Executes the test suite and generates a coverage report
7. **Coverage**: Reports the test coverage and compares it with the base coverage

## Dependencies

- actions/checkout@v4
- actions/setup-node@v4
- artiomtr/jest-coverage-report-action@v2

## Notes

- The workflow uses Node.js version 21.x
- Dependencies are cached to improve workflow speed
- Tests are run only on changed files
- A JSON coverage report is generated
- The coverage report is compared with the base coverage,
  with a minimum threshold of 80%
- All commands are run in the `app` directory of the repository
