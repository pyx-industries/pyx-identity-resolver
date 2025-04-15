---
sidebar_position: 2
title: Getting Started
---

import Disclaimer from './../\_disclaimer.mdx';

<Disclaimer />

# Getting Started

This section will help you quickly set up and understand the core components of the system.

## System Overview

The Pyx Identity Resolver uses Docker Compose to deploy two main services: a REST API (Identity Resolver Service) and a MinIO object store. The API handles identifier management, link registration, and resolution, while MinIO stores system data such as identifier schemes and link sets.

Here’s a high-level architecture of the system you’ll stand up:

```mermaid
graph TD
    A[Docker Compose] --> B[Identity Resolver Service - REST API]
    A --> C[MinIO Object Store]
    B -->|Stores/Retrieves Data| C
    D[User/Client] -->|HTTP Requests| B
```
