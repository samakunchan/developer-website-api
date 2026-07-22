# CHANGELOG developer-website-api
<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->

## 🚀 0.8.0 - 22/07/2026

### Added

- **Documents Feature Module**:
  - Implemented `DocumentsModule`, `DocumentsController`, and `DocumentsService` using `minio` client SDK.
  - Added public read endpoint:
    - `GET /documents`: Retrieve all documents stored in the S3 bucket, sorted by last modified date in descending order.
  - Added administrative endpoints protected by `ApiAuthGuard` and `AdminGuard`:
    - `POST /documents/upload`: Upload a document file to the Garage S3 storage bucket. Automatically resolves local endpoints inside Docker container using `host.docker.internal` gateway, and constructs public URLs using S3 public port/host mapping.
    - `DELETE /documents/:name`: Delete a document by its S3 object key name.
- **Unit Tests**:
  - Implemented complete unit tests for `DocumentsService` and `DocumentsController` with a fully mocked S3 Client and stream listener setup.

### Changed

- **Endpoint Documentation**:
  - Updated `DOCUMENTATION.md` to document the new `Documents` feature, its endpoints, and DTO models.
- **Environment Configuration**:
  - Appended local S3 / Garage configuration parameters to `.env`.

## 🚀 0.7.1 - 18/06/2026

### Added

- N/A

### Changed

- **Endpoint Documentation**:
  - Updated `DOCUMENTATION.md` to document the new Lexical properties (`tag`, `listType`, `start`, and `value`).

### Fixed

- **Legal Documents Settings Feature**:
  - Expanded `LexicalNodeDto` inside `UpdateLegalDocumentDto` to support missing Lexical list and heading node properties (`tag`, `listType`, `start`, and `value`) to match the client-side rich-text editor data schema.

## 🚀 0.7.0 - 18/06/2026

### Added

- **Legal Documents Settings Feature**:
  - Implemented `SettingsController` and `SettingsService` endpoints to manage rich-text based pages: **Legal Mentions** (`legal-mentions`), **CGU** (`cgu`), **Privacy Policy** (`privacy-policy`), and **Cookie Policy** (`cookie-policy`).
  - Added public read endpoints: `GET /settings/legal-mentions`, `GET /settings/cgu`, `GET /settings/privacy-policy`, and `GET /settings/cookie-policy`.
  - Added administrative write endpoints protected by `ApiAuthGuard` and `AdminGuard`: `PUT /settings/legal-mentions`, `PUT /settings/cgu`, `PUT /settings/privacy-policy`, and `PUT /settings/cookie-policy`.
  - Implemented custom structural JSON validation decorator `@IsLexicalJSON()` inside `UpdateLegalDocumentDto` to recursively validate nested Lexical editor node tree schemas, preventing NestJS global `{ whitelist: true }` pipe from pruning internal node properties.
- **Unit Tests**:
  - Implemented complete Jest unit tests for `SettingsController` and `SettingsService` verifying database fetching, document upserting/stringification, and Lexical structure validation.

### Changed

- **Endpoint Documentation**:
  - Fully rewrote and restructured `DOCUMENTATION.md` to follow a strict `#### Sub-Feature` -> `##### DTO Models` -> `##### Routes` -> `###### METHOD /route` hierarchy matching `example.md`.
  - Documented precise JSON payloads for all DTO request bodies.

### Fixed

- N/A

## 🚀 0.6.0 - 11/06/2026

### Added

- **Projects Feature Module**:
  - Implemented `ProjectsModule`, `ProjectsController`, and `ProjectsService` with custom nested validation DTOs (`CreateProjectDto`, `UpdateProjectDto`).
  - Added public read endpoints:
    - `GET /projects`: Retrieve all projects ordered by creation date descending.
    - `GET /projects/:id`: Retrieve a specific project by its numeric ID.
    - `GET /projects/slug/:slug`: Retrieve a specific project by its unique slug.
  - Added administrative endpoints protected by `ApiAuthGuard` and `AdminGuard`:
    - `POST /projects`: Create a new project.
    - `PUT /projects/:id`: Update an existing project.
    - `DELETE /projects/:id`: Delete a project and clean up its associated banner image files from the local filesystem.
    - `PATCH /projects/:id/featured`: Toggle a project's featured status.
    - `POST /projects/upload`: Upload and process a project banner image, resizing (medium) and optimizing it (raw & medium) using `sharp` to WebP formats, saving to `uploads/projects` directory, and returning the URL structure compatible with the frontend.
- **Admin Guard Authorization**:
  - Implemented `AdminGuard` to enforce role checking (`role === 'admin'`) for administrative endpoints.
  - Applied `AdminGuard` to all endpoints in `MessagesController`, the `setTheme` endpoint in `SettingsController`, and all non-presentation endpoints in `ProfilesController` to restrict sensitive administrative actions to admin roles.
- **Unit Tests**:
  - Implemented complete Jest unit tests for `ProjectsService` and `ProjectsController` with mocked Prisma client, filesystem, and Sharp image processes.

### Changed

- Registered `ProjectsModule` in the `AppModule`.

### Fixed

- N/A

## 🚀 0.5.0 - 11/06/2026

### Added

- **Messages Feature Module**:
  - Implemented `MessagesModule`, `MessagesController`, and `MessagesService` with custom input validation DTOs.
  - Added protected endpoints guarded by `ApiAuthGuard`:
    - `GET /messages`: Retrieve paginated and filtered contact messages.
    - `GET /messages/unread-count`: Retrieve the number of unread contact messages.
    - `PATCH /messages/:id/read`: Toggle the read status of a message.
- **Unit Tests**:
  - Implemented complete Jest unit tests for `MessagesService` and `MessagesController` with fully mocked `PrismaService` and `ApiAuthService`.

### Changed

- N/A

### Fixed

- N/A

## 🚀 0.4.0 - 10/06/2026

### Added

- **Profiles Feature Module**:
  - Implemented `ProfilesModule`, `ProfilesController`, and `ProfilesService` with custom input validation DTOs.
  - Added public presentation endpoint `GET /profiles/presentation` (no authentication required).
  - Added protected endpoints guarded by `ApiAuthGuard`:
    - `GET /profiles`: Retrieve user profile.
    - `PUT /profiles/personal-info`: Update user name and upsert personal information (bio, title, company, etc.).
    - `POST /profiles/tech-stack` / `DELETE /profiles/tech-stack/:id`: Add and remove developer technologies.
    - `POST /profiles/social-link` / `DELETE /profiles/social-link/:id`: Add and remove social media links.
    - `POST /profiles/avatar`: Upload a profile picture, validate size (max 2MB) and type (JPEG, PNG, WebP), resize to three resolutions (`tiny`, `medium`, and `raw` in WebP format) using `sharp`, store in a local `uploads/me` directory, and update database image URLs.
- **Global Assets Serving**:
  - Configured static file serving in [main.ts](file:///Users/samakunchan/Desktop/developpement/trainings/tanstack-projects/developer-website-api/src/main.ts) to serve files in the local root `uploads` folder under the `/uploads` prefix.
- **Postman API Documentation**:
  - Created a new **`Profiles`** folder in the Postman collection `91b54467-cc58-43ec-8b9b-d9a7c22e34cd` with all 8 endpoints configured.
  - Pre-configured the `Update Avatar` request with `multipart/form-data` and a `file` type parameter for ease of testing.

### Changed

- **Clean Dynamic DATABASE_URL Construction**:
  - Reverted raw string replacement of localhost URLs inside `bao.utils.ts` and removed the mapped env variable from `compose-dev.yml`.
  - Added clean dynamic construction of `DATABASE_URL` directly inside [bao.utils.ts](file:///Users/samakunchan/Desktop/developpement/trainings/tanstack-projects/developer-website-api/src/common/utils/bao.utils.ts) using individual Postgres secrets loaded from OpenBao, resolving connection issues inside Docker and local environments without host env dependencies.
- **Docker dev Environment Rebuild**:
  - Modified the development stage in `Dockerfile` to install the `procps` package to resolve hotreload process monitoring compilation crashes.
  - Modified dev start/stop helper scripts (`docker-build-dev.sh`, `stop-app.sh`, `env-bao.sh`) to support safe volume flushing (`down -v`) to avoid Multer/Sharp dependency caching conflicts, and corrected syntax to be POSIX compliant.

### Fixed

- N/A

## 🚀 0.3.0 - 10/06/2026

### Added

- **Dockerization Configuration**:
  - Added multi-stage `Dockerfile` (with targets `deps`, `dev`, `builder`, and `runner`).
  - Added `.dockerignore` file.
  - Added `compose.yml`, `compose-dev.yml`, `compose-stage.yml`, and `compose-prod.yml` to define multi-environment configurations.
  - Configured `compose-dev.yml` with `CHOKIDAR_USEPOLLING=true` for hot-reloading over mounted directories.
  - Exposed port `3003` in `compose-stage.yml` for staging API connectivity.
  - Added external network linking mapping the database from the `developer-website` project under the name `postgresdb`.

### Changed

- **Entrypoint Script**:
  - Refactored `shells/docker-entrypoint-prod.sh` to run the compiled NestJS server (`dist/main.js`) instead of frontend Nitro.
- **Startup and Stop Scripts**:
  - Updated `shells/start-app.sh` and `shells/stop-app.sh` to use the non-colliding `developer-website-api-$ENV` project prefix.
  - Refactored start/stop sequences to skip local postgresdb creation/removal since the database is externalized.
- **Environment Detection**:
  - Integrated dynamic running environment check via `process.env.NODE_ENV` in `AppService`.

### Fixed

- **Compilation Output Directory Path**:
  - Excluded `prisma.config.ts` from compilation in `tsconfig.build.json` to ensure compiled JavaScript outputs straight to `dist/main.js` instead of `dist/src/main.js`.

### Removed

- **Unused Shell Scripts**:
  - Deleted obsolete Prisma helper shell scripts from the `shells` directory.

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

### Fixed

- N/A

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
