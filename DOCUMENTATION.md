# Developer Website API - Endpoint Documentation
<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->
Welcome to the API documentation for the **Developer Website API**. This is a NestJS-based backend connected to a PostgreSQL database via Prisma, with secret management integrated using OpenBao.

---

## 🚀 General Configuration

- **Local Base URL**: `http://localhost:3002` (or the value of the `REPLACED_PORT` / `PORT` environment variables)
- **Static Assets Directory**: `/uploads` is exposed to serve uploaded images (e.g., `http://localhost:3002/uploads/me/...`)
- **Global Validation**: Standard DTO validation is active. Invalid requests return detailed `400 Bad Request` messages containing constraint failures.

---

## 🔒 Authentication & Authorization

The API supports two authentication flows, controlled by different guards:

### 1. API Token Flow (`ApiAuthGuard`)

Mainly used for external API consumers.

- **Header format**: `Authorization: Bearer <token>`
- Token is verified against the database. If missing or invalid, it throws `410 UnauthorizedException`.

### 2. Web Session Flow (`WebAuthGuard`)

Mainly used for the companion front-end website.

- **Cookie-based**: Looks for the `auth_session` cookie (HttpOnly, Secure in production).
- **Header Fallback**: If the cookie is not present, falls back to check the `Authorization: Bearer <token>` header.

### 3. Role-Based Access Control (`AdminGuard`)

- Some endpoints require the user to have the `admin` role (i.e. `user.role === 'admin'`).
- If an authenticated user doesn't have the `admin` role, the server returns a `403 ForbiddenException` with the message `"Only admins are allowed to perform this action"`.

---

## ⚠️ Global Error Handling

All unhandled errors and exceptions are caught by `AllExceptionsFilter` and returned in the following structure:

```json
{
  "statusCode": "STATUS_CODE",
  "exceptionName": "EXCEPTION_NAME_OR_ERROR_MESSAGE",
  "message": "DETAILED_ERROR_MESSAGE",
  "path": "REQUESTED_PATH",
  "date": "2026-06-11T10:00:00.000Z"
}
```

> [!NOTE]
> Stacktraces for internal errors are printed to stdout and appended to `api_error_logs.txt` at the root of the project (this log file is git-ignored).

---

## 📂 Endpoints Reference

### 🏠 General / Home Info

#### `GET /`

Retrieves information about the current API version and environment.

- **Auth Requirement**: Public (None)
- **Response (200 OK)**:

  ```json
  {
    "name": "developer-website-api",
    "description": "NestJS API for developer-website. It's an external API connected directly to the website.",
    "author": "Samakunchan",
    "version": "0.1.0",
    "environment": "development"
  }
  ```

---

### 🔑 Authentication (`auth/api` & `auth/web`)

Both authentication sub-modules share similar DTOs but differ in session management (tokens vs cookies).

#### DTO Schemas

- **SignInDto**:
  - `email` (string, required, format: email)
  - `password` (string, required)
- **ForgotPasswordDto**:
  - `email` (string, required, format: email)
- **ResetPasswordDto**:
  - `token` (string, required)
  - `password` (string, required, minLength: 8)
  - `confirmPassword` (string, required, minLength: 8)

---

#### 1. API Auth (`/auth/api`)

##### `POST /auth/api/sign-in`

Signs in a user and returns an API access token.

- **Auth Requirement**: Public
- **Request Body**: `SignInDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Samakunchan",
      "email": "[EMAIL_ADDRESS]",
      "role": "admin"
    }
  }
  ```

##### `POST /auth/api/sign-out`

Revokes the current API session token.

- **Auth Requirement**: `ApiAuthGuard`
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

##### `GET /auth/api/session`

Returns the currently authenticated user's profile details.

- **Auth Requirement**: `ApiAuthGuard`
- **Response (200 OK)**:

  ```json
  {
    "user": {
      "id": 1,
      "name": "Samakunchan",
      "email": "contact@samakunchan-technology.com",
      "role": "admin"
    }
  }
  ```

##### `POST /auth/api/forgot-password`

Sends a password reset link to the email specified.

- **Auth Requirement**: Public
- **Request Body**: `ForgotPasswordDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password reset email sent successfully"
  }
  ```

##### `POST /auth/api/reset-password`

Resets the password using a reset token.

- **Auth Requirement**: Public
- **Request Body**: `ResetPasswordDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password has been reset successfully"
  }
  ```

---

#### 2. Web Auth (`/auth/web`)

##### `POST /auth/web/sign-in`

Signs in a user and sets the HttpOnly session cookie `auth_session`.

- **Auth Requirement**: Public
- **Request Body**: `SignInDto`
- **Cookie Set**: `auth_session=<token>; HttpOnly; SameSite=Lax; Max-Age=86400; Path=/` (Secure in production)
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "Samakunchan",
      "email": "contact@samakunchan-technology.com",
      "role": "admin"
    }
  }
  ```

##### `POST /auth/web/sign-out`

Clears the `auth_session` cookie and invalidates the session.

- **Auth Requirement**: `WebAuthGuard`
- **Cookie Cleared**: `auth_session=; Path=/; Max-Age=0`
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

##### `GET /auth/web/session`

Returns the current session user details.

- **Auth Requirement**: `WebAuthGuard`
- **Response (200 OK)**:

  ```json
  {
    "user": {
      "id": 1,
      "name": "Samakunchan",
      "email": "contact@samakunchan-technology.com",
      "role": "admin"
    }
  }
  ```

##### `POST /auth/web/forgot-password`

Same behavior as API forgot password.

- **Auth Requirement**: Public
- **Request Body**: `ForgotPasswordDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password reset email sent successfully"
  }
  ```

##### `POST /auth/web/reset-password`

Same behavior as API reset password.

- **Auth Requirement**: Public
- **Request Body**: `ResetPasswordDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password has been reset successfully"
  }
  ```

---

### 🎨 Settings (`/settings`)

#### `GET /settings/theme`

Gets the current active layout theme for the client application.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "theme": "light"
  }
  ```

#### `PUT /settings/theme`

Updates the default application theme.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "theme": "dark"
  }
  ```

  *(Supported themes: `dark`, `forest`, `light`, `ocean`, `desert`, `guardian`, `aegis`)*
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "theme": "dark"
  }
  ```

---

### 👤 Profiles (`/profiles`)

Used to retrieve and update personal portfolio profiles, tech stacks, and social links.

#### `GET /profiles/presentation`

Public profile information formatted for portfolio rendering. Fetches details for the user associated with `ADMIN_EMAIL`.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "id": 1,
    "name": "Samakunchan",
    "email": "contact@samakunchan-technology.com",
    "role": "admin",
    "createdAt": "2026-06-11T08:13:27.000Z",
    "updatedAt": "2026-06-11T08:13:27.000Z",
    "personalInfo": {
      "id": 1,
      "professionalTitle": "Fullstack Web & Mobile Developer",
      "bio": "Passionate about creating modern applications using React, Node.js, and Flutter.",
      "experience": 5,
      "focus": "Clean architecture & user experience",
      "languages": "French (Native), English (Professional)",
      "coverImage": null,
      "userId": 1,
      "createdAt": "2026-06-11T08:13:27.000Z",
      "updatedAt": "2026-06-11T08:13:27.000Z"
    },
    "techStacks": [
      {
        "id": 1,
        "name": "React",
        "category": "frontend",
        "userId": 1,
        "createdAt": "2026-06-11T08:13:27.000Z",
        "updatedAt": "2026-06-11T08:13:27.000Z"
      }
    ],
    "socialLinks": [
      {
        "id": 1,
        "name": "GitHub",
        "url": "https://github.com/samakunchan",
        "icon": "github",
        "type": "github",
        "userId": 1,
        "createdAt": "2026-06-11T08:13:27.000Z",
        "updatedAt": "2026-06-11T08:13:27.000Z"
      }
    ],
    "image": {
      "id": 1,
      "tiny": "http://localhost:3002/uploads/me/avatar-1-123456-tiny.webp",
      "medium": "http://localhost:3002/uploads/me/avatar-1-123456-medium.webp",
      "raw": "http://localhost:3002/uploads/me/avatar-1-123456-raw.webp",
      "userId": 1,
      "createdAt": "2026-06-11T08:13:27.000Z",
      "updatedAt": "2026-06-11T08:13:27.000Z"
    }
  }
  ```

#### `GET /profiles`

Gets the profile information of the currently authenticated admin user.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Response (200 OK)**:
  *(Same structure as `GET /profiles/presentation` but based on the token owner)*

#### `PUT /profiles/personal-info`

Updates biography details, Professional title, and overall personal meta.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body** (`UpdatePersonalInfoDto`):
  - `fullName` (string, required)
  - `professionalTitle` (string, optional)
  - `bio` (string, optional)
  - `experience` (int, optional, >= 0)
  - `focus` (string, optional)
  - `languages` (string, optional)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

#### `POST /profiles/tech-stack`

Adds a technology item to the admin's tech stack.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body** (`CreateTechStackDto`):
  - `name` (string, required)
  - `category` (enum, required: `frontend`, `backend`, `devops`, `cloud`, `testing`, `mobile`)
- **Response (201 Created)**:

  ```json
  {
    "id": 2,
    "name": "NestJS",
    "category": "backend",
    "userId": 1,
    "createdAt": "2026-06-11T08:15:00.000Z",
    "updatedAt": "2026-06-11T08:15:00.000Z"
  }
  ```

#### `DELETE /profiles/tech-stack/:id`

Deletes a tech stack entry.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

#### `POST /profiles/social-link`

Adds a social/profile link.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body** (`CreateSocialLinkDto`):
  - `name` (string, required)
  - `url` (string, required, url format)
  - `icon` (string, required)
  - `type` (enum, required: `github`, `linkedin`, `upwork`, `malt`, `email`)
- **Response (201 Created)**:

  ```json
  {
    "id": 2,
    "name": "LinkedIn",
    "url": "https://linkedin.com/in/samakunchan",
    "icon": "linkedin",
    "type": "linkedin",
    "userId": 1,
    "createdAt": "2026-06-11T08:15:00.000Z",
    "updatedAt": "2026-06-11T08:15:00.000Z"
  }
  ```

#### `DELETE /profiles/social-link/:id`

Deletes a social link.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

#### `POST /profiles/avatar`

Uploads a profile picture, resizes it automatically to 3 sizes (tiny 32x32 WebP, medium 80x80 WebP, raw optimised WebP), and saves it to disk.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file` (Binary Image File, <= 2MB, formats: JPEG, PNG, WebP)
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "urls": {
      "tiny": "http://localhost:3002/uploads/me/avatar-1-123456-tiny.webp",
      "medium": "http://localhost:3002/uploads/me/avatar-1-123456-medium.webp",
      "raw": "http://localhost:3002/uploads/me/avatar-1-123456-raw.webp"
    }
  }
  ```

---

### 📂 Projects (`/projects`)

Provides endpoints to manage showcased portfolio projects.

#### DTO Models

##### `ProjectImageDto`

- `medium`: `ImageDetailDto`
- `raw`: `ImageDetailDto`

##### `ImageDetailDto`

- `url` (string, required)
- `alt` (string, optional)

##### `TechStackItemDto`

- `name` (string, required)
- `icon` (string, required)

##### `FeatureItemDto`

- `icon` (string, required)
- `title` (string, required)
- `description` (string, required)

---

#### `GET /projects`

Fetches all projects ordered by creation date descending.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  [
    {
      "id": 1,
      "slug": "e-commerce-platform",
      "title": "E-Commerce Web Application",
      "description": "A fully functional e-commerce storefront with Stripe integration.",
      "category": "web",
      "categoryLabel": "Web App",
      "caseStudyNumber": "01",
      "techIcons": ["react", "nodejs", "stripe"],
      "techStack": [
        { "name": "React", "icon": "react" }
      ],
      "features": [
        { "icon": "cart", "title": "Shopping Cart", "description": "Persistent item cart" }
      ],
      "isFeatured": true,
      "userId": 1,
      "status": "published",
      "createdAt": "2026-06-11T08:15:00.000Z",
      "updatedAt": "2026-06-11T08:15:00.000Z",
      "image": {
        "id": 1,
        "medium": { "url": "http://localhost:3002/uploads/projects/project-1-medium.webp", "alt": "" },
        "raw": { "url": "http://localhost:3002/uploads/projects/project-1-raw.webp", "alt": "" },
        "projectId": 1,
        "createdAt": "2026-06-11T08:15:00.000Z",
        "updatedAt": "2026-06-11T08:15:00.000Z"
      }
    }
  ]
  ```

#### `GET /projects/:id`

Retrieves a project details by ID.

- **Auth Requirement**: Public
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:
  *(Same structure as single project object in list)*

#### `GET /projects/slug/:slug`

Retrieves project details using its unique SEO slug.

- **Auth Requirement**: Public
- **Route Params**: `slug` (string, required)
- **Response (200 OK)**:
  *(Same structure as single project object)*

#### `POST /projects`

Creates a new project.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body** (`CreateProjectDto`):
  - `slug` (string, required, unique)
  - `title` (string, required)
  - `description` (string, optional)
  - `image` (`ProjectImageDto`, optional)
  - `category` (enum, required: `web`, `mobile`, `open_source`)
  - `categoryLabel` (string, optional)
  - `caseStudyNumber` (string, optional)
  - `techIcons` (array of strings, required)
  - `techStack` (array of `TechStackItemDto`, required)
  - `features` (array of `FeatureItemDto`, required)
  - `isFeatured` (boolean, optional, default: false)
  - `status` (enum, optional, default: `draft`. Supported: `draft`, `published`, `unpublished`, `archived`)
- **Response (201 Created)**:
  *(Returns the created Project object complete with relations)*

#### `PUT /projects/:id`

Updates a project fields.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Request Body** (`UpdateProjectDto`):
  *(All fields of `CreateProjectDto` but optional. Passing `image: null` deletes the associated image and files)*
- **Response (200 OK)**:
  *(Returns the updated Project object)*

#### `DELETE /projects/:id`

Deletes a project and its associated image files from storage.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

#### `PATCH /projects/:id/featured`

Toggles the `isFeatured` boolean status of a project.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:
  *(Returns the updated Project object)*

#### `POST /projects/upload`

Uploads a showcase banner image, resizes it (medium size 1200x800, raw optimized), saves it to disk and returns the server urls.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file` (Binary Image File, <= 5MB, formats: JPEG, PNG, WebP)
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "urls": {
      "medium": {
        "url": "http://localhost:3002/uploads/projects/project-123456-medium.webp",
        "alt": ""
      },
      "raw": {
        "url": "http://localhost:3002/uploads/projects/project-123456-raw.webp",
        "alt": ""
      }
    }
  }
  ```

---

### ✉️ Messages / Contact submissions (`/messages`)

Manages client contact message submissions.

#### DTO Models

##### `GetMessagesDto` (Query Parameters)

- `page` (int, optional, default: 1)
- `pageSize` (int, optional, default: 10)
- `filter` (enum, optional, default: `all`. Options: `all`, `read`, `unread`)
- `search` (string, optional, searches matches within `fullName`, `email`, `projectBrief`)

##### `UpdateMessageReadDto`

- `isRead` (boolean, required)

---

#### `GET /messages`

Gets a list of paginated and filtered contact messages.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Query Params**: `GetMessagesDto`
- **Response (200 OK)**:

  ```json
  {
    "messages": [
      {
        "id": 1,
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "serviceType": { "name": "Mobile Development" },
        "priceRangeType": { "label": "$5k - $10k" },
        "projectBrief": "I need a Flutter app built for my bakery shop.",
        "isRead": false,
        "createdAt": "2026-06-11T08:15:00.000Z",
        "updatedAt": "2026-06-11T08:15:00.000Z"
      }
    ],
    "total": 1,
    "totalPages": 1,
    "currentPage": 1
  }
  ```

#### `GET /messages/unread-count`

Retrieves the total count of unread messages.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Response (200 OK)**:

  ```json
  {
    "count": 1
  }
  ```

#### `PATCH /messages/:id/read`

Marks a message read status.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Request Body**: `UpdateMessageReadDto`
- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": {
      "id": 1,
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "serviceType": { "name": "Mobile Development" },
      "priceRangeType": { "label": "$5k - $10k" },
      "projectBrief": "I need a Flutter app built for my bakery shop.",
      "isRead": true,
      "createdAt": "2026-06-11T08:15:00.000Z",
      "updatedAt": "2026-06-11T08:16:00.000Z"
    }
  }
  ```
