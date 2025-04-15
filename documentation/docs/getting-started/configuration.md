---
sidebar_position: 4
title: Configuration
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Configuration

This section outlines where the configuration for the Identity Resolver Service (IDR) is stored and details the environment variables used to manage its behavior.

## Location

The configuration for the Identity Resolver Service (IDR) is stored in environment-specific files located in the project’s `app` directory. These files are used to define environment variables based on the application’s runtime environment, which is determined by the `NODE_ENV` variable. The files are:

- `.env.development.local` and `.env.development` for the development environment.
- `.env.test.local` and `.env.test` for the test environment.
- `.env.production.local` and `.env.production` for the production environment.  
  The `.env.[environment].local` files take precedence over the corresponding `.env.[environment]` files, allowing for local overrides without affecting the base configuration.

## Core Variables

| Variable             | Description                                               |
| -------------------- | --------------------------------------------------------- |
| NODE_ENV             | Specifies the environment (development, test, production) |
| RESOLVER_DOMAIN      | The base URL of the resolver service                      |
| PORT                 | The port the resolver service is exposed to               |
| APP_NAME             | The name of the application                               |
| API_KEY              | API key for authentication                                |
| LINK_TYPE_VOC_DOMAIN | The base URL of the link type vocabulary endpoint         |

## Object Storage Configuration

| Variable                   | Description                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OBJECT_STORAGE_ENDPOINT    | The MinIO server endpoint or object storage endpoint                                                                                                               |
| OBJECT_STORAGE_PORT        | The MinIO server port. If using object storage, not required                                                                                                       |
| OBJECT_STORAGE_USE_SSL     | Whether to use SSL for MinIO connections                                                                                                                           |
| OBJECT_STORAGE_ACCESS_KEY  | The MinIO access key or cloud provider access key                                                                                                                  |
| OBJECT_STORAGE_SECRET_KEY  | The MinIO secret key or cloud provider secret key                                                                                                                  |
| OBJECT_STORAGE_PATH_STYLE  | Enable or disable path-style requests for MinIO. Set to `false` for cloud providers. Set to `true` if you are using MinIO Gateway. By default, it is set to `true` |
| OBJECT_STORAGE_BUCKET_NAME | Name of the MinIO bucket to use                                                                                                                                    |

## Other Configuration

| Variable        | Description                            |
| --------------- | -------------------------------------- |
| IDENTIFIER_PATH | Path for identifier-related operations |

## NODE_ENV

The `NODE_ENV` variable is crucial for determining which environment variable files are loaded by the application:

- `development`: Loads the environment variables from `.env.development.local` and `.env.development`.
- `test`: Loads the environment variables from `.env.test.local` and `.env.test`.
- `production`: Loads the environment variables from `.env.production.local` and `.env.production`.

---
