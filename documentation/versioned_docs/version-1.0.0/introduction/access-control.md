---
sidebar_position: 3
title: Access Control
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Access Control

## Anonymous users

- Resolve link information without authentication

## Authenticated users

- Register and manage identifier schemes
- Register and manage supported link types for identifier schemes
- Register and manage links for specific identifiers within permitted identifier schemes

## Authentication

The way in which users authenticate with the Identity Resolver is by providing an API when making a request to the service.
This API key is set when the system is initialise and can be configured by modifying the `API_KEY` environment variable within the `.env.development` file.
More details on how to configure the system can be found [here](docs/getting-started/configuration.md)
