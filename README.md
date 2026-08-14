# Developer Website API

[![Nest Logo](https://nestjs.com/img/logo-small.svg)](https://nestjs.com/)

**Developer Website API** is a progressive NestJS-based API running on Node.js (v22), backed by a PostgreSQL database with vector extensions (via Prisma), integrated with OpenBao for secret management, and utilising Garage S3 (via MinIO SDK) for file storage.

---

## 🛠️ Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: PostgreSQL (with pgvector support)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Secret Management**: [OpenBao](https://openbao.org/) (AppRole authentication)
- **Storage**: Garage S3 (integrated via `minio` client)
- **Package Manager**: Yarn

---

## 📋 Prerequisites

Before setting up the project, make sure you have the following installed and running:

- **Node.js** (v22.x recommended)
- **Yarn** (strictly required; do not use `npm` or `npx` in this project)
- **Docker & Docker Compose** (for containerized environments)
- **Database & Secret Infrastructure**: The PostgreSQL database and OpenBao service run in a separate infrastructure repository/compose network (`developer-website-db-*`). Ensure that project is running before starting the API in containerized modes.

---

## 🔒 Environment Setup

1. Copy the example environment template file to create your `.env` file:

   ```bash
   cp .env.example .env
   ```

2. Configure your OpenBao AppRole credentials in the `.env` file:
   - `BAO_ADDR`: The local address of OpenBao (e.g. `http://localhost:8200` or `http://host.docker.internal:8200` inside Docker).
   - `BAO_ROLE_ID`: Your AppRole Role ID.
   - `BAO_SECRET_ID`: Your AppRole Secret ID.
   - `BAO_PATH`: The secret storage path in OpenBao (e.g., `secret/data/developer-website-api`).
   - `BAO_ADDR_STAGE_PROD`: Address of the staging/production OpenBao instance when running local migrations/debugging targeting those environments.

> [!NOTE]
> All other application secrets (including database credentials, JWT keys, and S3 credentials) are fetched dynamically from OpenBao at runtime when the application starts, and injected into `process.env`.

---

## 📥 Installation

Install the project dependencies using Yarn:

```bash
yarn install
```

---

## 💻 Local Development (Standalone/Bare Metal)

Ensure that your local database and OpenBao service are running on your host machine.

### 1. Generate Prisma Client

Generate the local Prisma client based on the database schema:

```bash
yarn prisma generate
```

### 2. Apply Database Schema

Push the schema changes directly to your local development database:

```bash
yarn prisma db push
```

### 3. Run the Application

Start the development server with hot-reload enabled. This command automatically fetches vault secrets and sets the correct database connection URL locally via `shells/env-bao.sh`:

```bash
yarn start:dev
```

Other start commands:

```bash
# Standard start
yarn start

# Debug mode with watch
yarn start:debug

# Production build preview (assumes dist/ folder exists)
yarn start:prod
```

---

## 🐋 Running with Docker (Containerized Environments)

The project includes script helpers under `./shells` to manage containerized lifecycles. The container builds are structured into multiple targets (such as `dev` and `runner` for production/staging).

> [!IMPORTANT]
> The Docker configurations expect database containers to be running in external networks managed by the base infrastructure project (e.g., `developer-website-db-dev_default`, `developer-website-db-stage_default`).

### 1. Development Environment (`dev`)

Runs the NestJS application in watch mode inside a Docker container. Host files are bind-mounted, and local changes trigger a restart.

- **Port Mapping**: `3002:3002`
- **Database Link**: Connects to `developer-website-db` (linked as `postgresdb` via network `developer-website-db-dev_default`)
- **Commands**:

  ```bash
  # Start the development container
  ./shells/start-app.sh dev

  # Stop and clean dev containers & volume caches
  ./shells/stop-app.sh dev

  # Rebuild and restart the dev container
  ./shells/docker-build-dev.sh
  ```

### 2. Staging Environment (`stage`)

Runs the production build of the application in staging configuration.

- **Port Mapping**: `3003:3002`
- **Database Link**: Connects to `developer-website-db-stage` (linked as `postgresdb` via network `developer-website-db-stage_default`)
- **Commands**:

  ```bash
  # Start the staging container
  ./shells/start-app.sh stage

  # Stop and clean staging containers & volumes
  ./shells/stop-app.sh stage

  # Rebuild and restart the staging container
  ./shells/docker-build-stage.sh
  ```

### 3. Production Environment (`prod`)

Runs the production build of the application optimized for a VPS setup with a reverse proxy.

- **Port Mapping**: Bound to `default` and `nginx-proxy-network` (used for Nginx Proxy Manager)
- **Database Link**: Connects to `developer-website-db-prod` (linked as `postgresdb`)
- **Commands**:

  ```bash
  # Start the production container
  ./shells/start-app.sh prod

  # Stop and clean production containers & volumes
  ./shells/stop-app.sh prod

  # Rebuild and restart the production container
  ./shells/docker-build-prod.sh
  ```

---

## 🧪 Testing

The codebase includes unit and integration tests managed with Jest.

```bash
# Run unit tests
yarn test

# Run unit tests in watch mode
yarn test:watch

# Run e2e tests
yarn test:e2e

# Check test coverage
yarn test:cov
```

---

## 🧹 Code Quality

Make sure your code complies with linting and styling configurations before committing:

```bash
# Format code using Prettier
yarn format

# Lint code using ESLint
yarn lint
```

---

## 📝 Troubleshooting & Logging

- **Local Error Log**: Unhandled runtime exceptions and internal stack traces are captured by a global filter and appended to [api_error_logs.txt](file:///Users/samakunchan/Desktop/developpement/trainings/tanstack-projects/developer-website-api/api_error_logs.txt) at the root of the project. This file is git-ignored.
- **OpenBao Connections**: If the app fails to start with `Failed to login to OpenBao`, verify your `.env` credentials and ensure the OpenBao server is reachable (e.g. at port `8200`).
- **Prisma Client Issues**: If you encounter missing database schema types, regenerate the client manually using `yarn prisma generate`.
