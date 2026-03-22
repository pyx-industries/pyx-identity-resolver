---
sidebar_position: 1
title: Development Setup
---

# Development Setup

This guide walks you through getting a local development environment
for the Pyx Identity Resolver up and running from scratch.
If you're new to the project,
start with [Understanding the Service](../understanding-the-service/index.md)
for background on the architecture and core concepts.

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | >= 21.0.0 | Check with `node --version` |
| **npm** | Bundled with Node.js | Used for the application (`app/`) |
| **Yarn** | Latest stable | Used for the documentation site (`documentation/`) |
| **Docker** | Latest stable | Required for MinIO and E2E tests |
| **Docker Compose** | Bundled with Docker Desktop | Used to orchestrate services |

## Clone and install

1. Clone the repository:

```bash
git clone https://github.com/pyx-industries/pyx-identity-resolver.git
cd pyx-identity-resolver
```

2. Install root-level dependencies (Husky hooks and commitlint):

```bash
npm install
```

3. Install application dependencies:

```bash
cd app
npm install
```

4. If you plan to work on the documentation site, install its dependencies too:

```bash
cd documentation
yarn install
```

## Development configuration

The application uses environment-specific files in the `app/` directory
to configure its behaviour.
The `NODE_ENV` variable determines which set of files is loaded.

### How environment files work

For each environment, two files can exist:

- `.env.<environment>` -- base configuration, committed to the repository.
- `.env.<environment>.local` -- local overrides, **not** committed to the repository.

The `.local` file takes precedence,
so you can override any base value without touching shared configuration.

### Setting up your local environment

The repository includes example files you can copy as a starting point:

```bash
cd app
cp .env.development.local.example .env.development.local
cp .env.test.local.example .env.test.local
```

### Default development values

The example files provide sensible defaults for local development:

| Variable | Default | Description |
|----------|---------|-------------|
| `OBJECT_STORAGE_ENDPOINT` | `localhost` | MinIO server address |
| `OBJECT_STORAGE_PORT` | `9000` | MinIO API port |
| `OBJECT_STORAGE_USE_SSL` | `false` | Disable SSL for local MinIO |
| `OBJECT_STORAGE_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `OBJECT_STORAGE_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `OBJECT_STORAGE_BUCKET_NAME` | `idr-bucket` | Bucket name (use `idr-bucket-test` for test env) |
| `OBJECT_STORAGE_PATH_STYLE` | `true` | Required for local MinIO |
| `IDENTIFIER_PATH` | `identifiers` | Path for identifier operations |
| `RESOLVER_DOMAIN` | `http://localhost:3000/api/3.0.0` | Base resolver URL |
| `LINK_TYPE_VOC_DOMAIN` | `http://localhost:3000/api/3.0.0/voc` | Link type vocabulary URL |
| `API_KEY` | `test123` | API key for authenticated endpoints |
| `APP_NAME` | `IDR` | Application name |
| `PORT` | `3000` | Server port |

For a full reference of all configuration options,
see the [Configuration](../deployment-guide/configuration.md) page.

## Running locally

### Start MinIO

The application requires a MinIO instance for object storage.
The easiest way to run one is with Docker Compose:

```bash
docker compose up -d minio
```

This starts MinIO on port `9000` (API) and port `9090` (console).

### Start the development server

From the `app/` directory, start the NestJS application with hot reload:

```bash
npm run start:dev
```

The server starts on `http://localhost:3000` by default.
Changes to source files trigger an automatic restart.

You can also use these alternative start commands:

| Command | Description |
|---------|-------------|
| `npm run start` | Start without watch mode |
| `npm run start:dev` | Start with hot reload (recommended) |
| `npm run start:debug` | Start with hot reload and Node.js debugger |

Once the server is running,
you can access the Swagger API documentation at
[http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Running tests

All test commands are run from the `app/` directory.

### Unit tests

```bash
npm test
```

Run unit tests in watch mode during development:

```bash
npm run test:watch
```

Generate a coverage report:

```bash
npm run test:cov
```

The project enforces a minimum coverage threshold of **80%**
across branches, functions, lines, and statements.

### End-to-end tests

:::info
E2E tests require a running MinIO instance and a running application server.
The simplest way to provide both is with Docker Compose,
which starts MinIO and the application together.
:::

1. Start MinIO and the application with Docker Compose:

```bash
docker compose up -d
```

2. Run the E2E tests:

```bash
cd app
npm run test:e2e -- --forceExit
```

:::tip
E2E tests use a separate test bucket (`idr-bucket-test`)
to avoid interfering with development data.
Make sure your `.env.test.local` file points to the correct bucket name.
:::

## Linting and formatting

:::tip
Run `format:check` and `lint` before pushing --
the CI pipeline runs both on every pull request
and failures will block your PR.
:::

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Check formatting
npm run format:check

# Auto-format files
npm run format
```

## Project structure

The application follows a modular NestJS architecture.
Here's an overview of the key directories inside `app/src/modules/`:

```
app/src/modules/
  common/               # Shared application-level services (e.g. health checks)
  identifier-management/  # Registering and configuring identifier schemes
  link-registration/      # Registering and managing links for identifiers
  link-resolution/        # Resolving identifiers to their linked resources
  shared/                 # Cross-cutting utilities shared across modules
```

| Module | Responsibility |
|--------|---------------|
| **Identifier Management** | CRUD operations for identifier schemes (e.g. GTIN, lot). Defines which identifiers the resolver supports. |
| **Link Registration** | Registering, updating, and managing links and responses for specific identifiers within permitted schemes. |
| **Link Resolution** | Resolving identifiers to their linked resources following ISO 18975 and RFC 9264. Handles content negotiation and link header generation. |
| **Common** | Application-level concerns like health checks. |
| **Shared** | Utilities and helpers used across multiple modules. |

### Other key directories

```
app/
  test/             # E2E test specs and configuration
  src/__mocks__/    # Shared test mocks and factories
documentation/      # Docusaurus documentation site
.github/workflows/  # CI/CD pipeline definitions
```

## Documentation site

The documentation site is built with [Docusaurus](https://docusaurus.io/).
To run it locally:

```bash
cd documentation
yarn start
```

This starts a local development server with hot reload at `http://localhost:3000`.

To build the site:

```bash
yarn build
```

To serve the production build locally:

```bash
yarn serve
```
