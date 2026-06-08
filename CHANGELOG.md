# CHANGELOG developer-website-api

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
