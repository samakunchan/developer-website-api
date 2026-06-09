# CHANGELOG developer-website-api

## 🚀 0.2.0 - 09/06/2026

### Added

- **API Authentication Revocation**:
  - Added `currentApiSessionId` in the `User` database model to track active API tokens.
  - Implemented `/auth/api/sign-out` endpoint to invalidate API tokens by clearing `currentApiSessionId` in the database.
  - Configured `ApiAuthGuard` to validate that the token's `apiSessionId` payload matches the one in the database.
- **Redirection Password Reset for API**:
  - Implemented programmatic password reset routes `/auth/api/forgot-password` and `/auth/api/reset-password` that send a reset email containing a link redirecting users back to the frontend website.
  - Password resets now invalidate all active web and API sessions for security.
- **Unit Tests**:
  - Implemented complete Jest unit tests for the updated `ApiAuthService` and `ApiAuthController` to verify token revocation and password reset behaviors.

### Changed

- Refactored legacy authentication into Web Auth (`/auth/web`) and API Auth (`/auth/api`) to separate stateful cookie sessions from stateless token-based sessions.
- Synced the shared PostgreSQL database schemas in both workspaces and regenerated local Prisma client bindings.

## 🚀 0.1.0 - 08/06/2026

### Added

- NestJS boilerplate project initialized with Yarn and strict mode.
- OpenBao secrets integration utility `bao.utils.ts` to fetch app secrets using AppRole approle login and populate `process.env` dynamically.
- `PrismaService` configured with `@prisma/adapter-pg` driver adapter using PG connection pool.
- Authentication feature implementing:
  - `POST /auth/sign-in` (validates password with `bcryptjs`, tracks login failures and lockout state, generates UUID session, and sets `auth_session` cookie).
  - `POST /auth/sign-out` (clears cookie and removes session ID in DB).
  - `GET /auth/session` (returns currently authenticated user session details).
  - `POST /auth/forgot-password` (generates reset token and triggers email).
  - `POST /auth/reset-password` (resets password with token).
- `AuthGuard` protecting routes using `auth_session` cookie or fallback `Authorization: Bearer <token>` header.
- `EmailService` utilizing nodemailer (supports Ethereal in development and SMTP in production).
- Global `AllExceptionsFilter` returning standardized JSON payloads and appending stack traces to `api_error_logs.txt`.
- Unit tests for `AppController`, `AuthService`, and `AuthController`.

### Changed

- Configured `package.json` dev and start scripts to source `env-bao.sh dev` dynamically at startup.
- Configured NestJS bootstrap `main.ts` to load secrets, register `cookie-parser`, apply CORS, enable ValidationPipe, and set server port to `3002`.
- Upgraded TypeScript to `^5.9.3` to match generated Prisma client typing specifications.

### Fixed

- N/A
