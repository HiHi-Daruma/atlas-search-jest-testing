# Atlas Search Testing with Jest and Testcontainers

This repository demonstrates how to test MongoDB Atlas Search queries locally using the `mongodb-atlas-local` Docker image with Testcontainers and Jest in TypeScript.

## Overview

Testing Atlas Search queries has traditionally been challenging because Atlas Search requires a fully managed MongoDB Atlas cluster. This repository shows how to overcome this limitation by using:

- **MongoDB Atlas Local**: A Docker image that includes Atlas Search capabilities
- **Testcontainers**: Automatically manages container lifecycle during tests
- **Jest**: Popular testing framework with global setup/teardown hooks
- **TypeScript**: Type-safe test development

## Features

-  Fully isolated integration tests for Atlas Search
-  Automatic Docker container lifecycle management
-  Reliable search index creation and document synchronization
-  Reusable test utilities for search index setup
-  Example movie search implementation with comprehensive tests

## Getting Started

### Installation

```bash
npm install
```

### Running Tests

```bash
npm test
```

This command will:
1. Start a `mongodb-atlas-local` container using Testcontainers
2. Run all test suites
3. Automatically stop and cleanup the container

## Project Structure

```
├── src/
│   ├── movies/
│   │   ├── movie.types.ts           # Movie data type definitions
│   │   ├── search-movies.ts         # Search implementation using $search
│   │   └── search-movies.test.ts    # Integration tests for search functionality
│   └── test-utils/
│       ├── insert-many-in-atlas-search.ts  # Helper for inserting docs and waiting for indexing
│       └── search-index.types.ts           # Search index type definitions
├── setup-testcontainer.js           # Jest global setup - starts MongoDB container
├── teardown-testcontainer.js        # Jest global teardown - stops container
├── jest.config.js                   # Jest configuration
└── tsconfig.json                    # TypeScript configuration
```
