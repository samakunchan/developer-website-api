# Developer Website API - Endpoint Documentation
<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->
Welcome to the API documentation for the **Developer Website API**. This is a NestJS-based backend connected to a PostgreSQL database via Prisma, with secret management integrated using OpenBao.

---

## 🚀 General Configuration

- **Local Base URL**: `http://localhost:3002` (or the value of the `REPLACED_PORT` / `PORT` environment variables)
- **Static Assets Directory**: `/uploads` is exposed to serve uploaded images (e.g., `http://localhost:3002/uploads/me/...`)
- **Garage S3 Storage**: Used for documents management. In development, S3 API runs on `http://localhost:3900` (handled by backend client via `host.docker.internal` inside Docker), and S3 Web public access runs on `http://papanguesoft.web.garage.localhost:3902`.
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

#### General Info

##### DTO Models

No request DTOs required.

##### Routes

###### `GET /`

Retrieves information about the current API version and environment.

- **Auth Requirement**: Public (None)
- **Response (200 OK)**:

  ```json
  {
    "name": "[APP_NAME]",
    "description": "[APP_DESCRIPTION]",
    "author": "[APP_AUTHOR]",
    "version": "[APP_VERSION]",
    "environment": "[APP_ENV]"
  }
  ```

---

### 🔑 Authentication (`auth/api` & `auth/web`)

Both authentication sub-modules share similar DTOs but differ in session management (tokens vs cookies).

#### Sign In

##### DTO Models

- `email` (string, required, format: email) -> The email address to sign in.
- `password` (string, required) -> The account password.

##### Routes

###### `POST /auth/api/sign-in`

Signs in a user and returns an API access token.

- **Auth Requirement**: Public
- **Request Body**:

  ```json
  {
    "email": "contact@samakunchan-technology.com",
    "password": "yourpassword"
  }
  ```

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

---

#### Sign Out

##### DTO Models

No request DTOs required.

##### Routes

###### `POST /auth/api/sign-out`

Revokes the current API session token.

- **Auth Requirement**: `ApiAuthGuard`
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

###### `POST /auth/web/sign-out`

Clears the `auth_session` cookie and invalidates the session.

- **Auth Requirement**: `WebAuthGuard`
- **Cookie Cleared**: `auth_session=; Path=/; Max-Age=0`
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

---

#### User Session

##### DTO Models

No request DTOs required.

##### Routes

###### `GET /auth/api/session`

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

###### `GET /auth/web/session`

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

---

#### Forgot Password

##### DTO Models

- `email` (string, required, format: email) -> The email address to send the password reset link.

##### Routes

###### `POST /auth/api/forgot-password`

Sends a password reset link to the email specified.

- **Auth Requirement**: Public
- **Request Body**:

  ```json
  {
    "email": "contact@samakunchan-technology.com"
  }
  ```

- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password reset email sent successfully"
  }
  ```

---

#### Reset Password

##### DTO Models

- `token` (string, required) -> The password reset token received via email.
- `password` (string, required, minLength: 8) -> The new password.
- `confirmPassword` (string, required, minLength: 8) -> The password confirmation. Must match the new password.

##### Routes

###### `POST /auth/api/reset-password`

Resets the password using a reset token.

- **Auth Requirement**: Public
- **Request Body**:

  ```json
  {
    "token": "reset-token-xyz",
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
  }
  ```

- **Response (200 OK)**:

  ```json
  {
    "success": true,
    "message": "Password has been reset successfully"
  }
  ```

---

### 🎨 Settings (`/settings`)

#### Themes

##### DTO Models

- `theme` (enum, required) -> The theme name. Supported values: `dark`, `forest`, `light`, `ocean`, `desert`, `guardian`, `aegis`.

##### Routes

###### `GET /settings/theme`

Gets the current active layout theme for the client application.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "theme": "light"
  }
  ```

###### `PUT /settings/theme`

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

#### Legal Mentions

##### DTO Models

- `title` (string, required) -> Title of the document.
- `content` (string, required) -> Must be a valid stringified JSON matching the Lexical structure.
  - **Lexical Structure Details**:
    - `root` (object, required) -> Root node of the document.
      - `type` (string, required, e.g. `"root"`)
      - `version` (number, required)
      - `children` (array of nodes, optional) -> Nested children nodes having properties:
        - `type` (string, required, e.g., `"root"`, `"heading"`, `"paragraph"`, `"text"`, `"list"`, `"listitem"`)
        - `version` (number, required)
        - `text` (string, optional)
        - `children` (array, optional)
        - `direction` (string, optional)
        - `format` (string/number, optional)
        - `indent` (number, optional)
        - `detail` (number, optional)
        - `mode` (string, optional)
        - `style` (string, optional)
        - `textFormat` (number, optional)
        - `textStyle` (string, optional)
        - `tag` (string, optional)
        - `listType` (string, optional)
        - `start` (number, optional)
        - `value` (number, optional)

##### Routes

###### `GET /settings/legal-mentions`

Gets the Legal Mentions rich-text document.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "id": 1,
    "title": "Mentions Légales",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu des mentions légales.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
    "createdAt": "2026-06-18T08:00:00.000Z",
    "updatedAt": "2026-06-18T08:00:00.000Z"
  }
  ```

###### `PUT /settings/legal-mentions`

Updates/Upserts the Legal Mentions rich-text document.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "title": "Mentions Légales",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu des mentions légales.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}"
  }
  ```

- **Response (200 OK)**:
  *(Returns the updated LegalMentions object)*

---

#### CGU

##### DTO Models

- `title` (string, required) -> Title of the document.
- `content` (string, required) -> Must be a valid stringified JSON matching the Lexical structure.
  - **Lexical Structure Details**: *(Shares the same Lexical structure as Legal Mentions)*

##### Routes

###### `GET /settings/cgu`

Gets the CGU (Terms & Conditions) rich-text document.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "id": 1,
    "title": "Conditions Générales d'Utilisation",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu des CGU.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
    "createdAt": "2026-06-18T08:00:00.000Z",
    "updatedAt": "2026-06-18T08:00:00.000Z"
  }
  ```

###### `PUT /settings/cgu`

Updates/Upserts the CGU rich-text document.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "title": "Conditions Générales d'Utilisation",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu des CGU.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}"
  }
  ```

- **Response (200 OK)**:
  *(Returns the updated CGU object)*

---

#### Privacy Policy

##### DTO Models

- `title` (string, required) -> Title of the document.
- `content` (string, required) -> Must be a valid stringified JSON matching the Lexical structure.
  - **Lexical Structure Details**: *(Shares the same Lexical structure as Legal Mentions)*

##### Routes

###### `GET /settings/privacy-policy`

Gets the Privacy Policy rich-text document.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "id": 1,
    "title": "Politique de Confidentialité",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu de la politique de confidentialité.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
    "createdAt": "2026-06-18T08:00:00.000Z",
    "updatedAt": "2026-06-18T08:00:00.000Z"
  }
  ```

###### `PUT /settings/privacy-policy`

Updates/Upserts the Privacy Policy rich-text document.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "title": "Politique de Confidentialité",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu de la politique de confidentialité.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}"
  }
  ```

- **Response (200 OK)**:
  *(Returns the updated PrivacyPolicy object)*

---

#### Cookie Policy

##### DTO Models

- `title` (string, required) -> Title of the document.
- `content` (string, required) -> Must be a valid stringified JSON matching the Lexical structure.
  - **Lexical Structure Details**: *(Shares the same Lexical structure as Legal Mentions)*

##### Routes

###### `GET /settings/cookie-policy`

Gets the Cookie Policy rich-text document.

- **Auth Requirement**: Public
- **Response (200 OK)**:

  ```json
  {
    "id": 1,
    "title": "Politique des Cookies",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu de la politique des cookies.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}",
    "createdAt": "2026-06-18T08:00:00.000Z",
    "updatedAt": "2026-06-18T08:00:00.000Z"
  }
  ```

###### `PUT /settings/cookie-policy`

Updates/Upserts the Cookie Policy rich-text document.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "title": "Politique des Cookies",
    "content": "{\"root\":{\"children\":[{\"children\":[{\"detail\":0,\"format\":0,\"mode\":\"normal\",\"style\":\"\",\"text\":\"Contenu de la politique des cookies.\",\"type\":\"text\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"paragraph\",\"version\":1}],\"direction\":\"ltr\",\"format\":\"\",\"indent\":0,\"type\":\"root\",\"version\":1}}"
  }
  ```

- **Response (200 OK)**:
  *(Returns the updated CookiePolicy object)*

---

### 👤 Profiles (`/profiles`)

Used to retrieve and update personal portfolio profiles, tech stacks, and social links.

#### Profile Presentation

##### DTO Models

No request payload; returns the complete Profile response.

##### Routes

###### `GET /profiles/presentation`

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

###### `GET /profiles`

Gets the profile information of the currently authenticated admin user.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Response (200 OK)**:
  *(Same structure as `GET /profiles/presentation` but based on the token owner)*

---

#### Personal Information

##### DTO Models

- `fullName` (string, required) -> The user's full name.
- `professionalTitle` (string, optional, nullable) -> The professional subtitle (e.g. `"Fullstack Web & Mobile Developer"`).
- `bio` (string, optional, nullable) -> The biography description.
- `experience` (int, optional, >= 0, nullable) -> Years of professional experience.
- `focus` (string, optional, nullable) -> Primary work focus or expertise.
- `languages` (string, optional, nullable) -> Spoken or professional languages.

##### Routes

###### `PUT /profiles/personal-info`

Updates biography details, Professional title, and overall personal meta.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "fullName": "Samakunchan",
    "professionalTitle": "Fullstack Web & Mobile Developer",
    "bio": "Passionate about creating modern applications using React, Node.js, and Flutter.",
    "experience": 5,
    "focus": "Clean architecture & user experience",
    "languages": "French (Native), English (Professional)"
  }
  ```

- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

---

#### Tech Stack

##### DTO Models

- `name` (string, required) -> Name of the technology.
- `category` (enum, required) -> Tech stack category. Supported values: `frontend`, `backend`, `devops`, `cloud`, `testing`, `mobile`.

##### Routes

###### `POST /profiles/tech-stack`

Adds a technology item to the admin's tech stack.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "name": "NestJS",
    "category": "backend"
  }
  ```

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

###### `DELETE /profiles/tech-stack/:id`

Deletes a tech stack entry.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

---

#### Social Links

##### DTO Models

- `name` (string, required) -> Name of the social network/platform.
- `url` (string, required, format: URL) -> URL target of the link.
- `icon` (string, required) -> Icon identifier.
- `type` (enum, required) -> Social type enum. Supported values: `github`, `linkedin`, `upwork`, `malt`, `email`.

##### Routes

###### `POST /profiles/social-link`

Adds a social/profile link.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "name": "LinkedIn",
    "url": "https://linkedin.com/in/samakunchan",
    "icon": "linkedin",
    "type": "linkedin"
  }
  ```

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

###### `DELETE /profiles/social-link/:id`

Deletes a social link.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

---

#### Avatar Image

##### DTO Models

Uses standard `multipart/form-data` with binary payload.

##### Routes

###### `POST /profiles/avatar`

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

#### Project Listing & Details

##### DTO Models

No request DTOs required.

##### Routes

###### `GET /projects`

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

###### `GET /projects/:id`

Retrieves a project details by ID.

- **Auth Requirement**: Public
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:
  *(Same structure as single project object in list)*

###### `GET /projects/slug/:slug`

Retrieves project details using its unique SEO slug.

- **Auth Requirement**: Public
- **Route Params**: `slug` (string, required)
- **Response (200 OK)**:
  *(Same structure as single project object)*

---

#### Project Creation

##### DTO Models

- `slug` (string, required, unique) -> SEO slug.
- `title` (string, required) -> Project title.
- `description` (string, optional) -> Project description.
- `image` (object, optional) -> Project banner image details containing:
  - `medium` (object, required) -> Medium image details: `url` (string, required), `alt` (string, optional)
  - `raw` (object, required) -> Raw image details: `url` (string, required), `alt` (string, optional)
- `category` (enum, required) -> Project category. Supported values: `web`, `mobile`, `open_source`.
- `categoryLabel` (string, optional) -> Display label for category.
- `caseStudyNumber` (string, optional, nullable) -> Number label for sequence.
- `techIcons` (array of strings, required) -> Icon list.
- `techStack` (array of objects, required) -> Detail list of technologies containing `name` (string, required) and `icon` (string, required).
- `features` (array of objects, required) -> Highlights of the project containing `icon` (string, required), `title` (string, required), and `description` (string, required).
- `isFeatured` (boolean, optional, default: false) -> Flag to highlight on portfolio.
- `status` (enum, optional, default: `draft`) -> Publication status. Supported values: `draft`, `published`, `unpublished`, `archived`.

##### Routes

###### `POST /projects`

Creates a new project.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body**:

  ```json
  {
    "slug": "e-commerce-platform",
    "title": "E-Commerce Web Application",
    "description": "A fully functional e-commerce storefront with Stripe integration.",
    "category": "web",
    "categoryLabel": "Web App",
    "caseStudyNumber": "01",
    "techIcons": ["react", "nodejs", "stripe"],
    "techStack": [
      {
        "name": "React",
        "icon": "react"
      }
    ],
    "features": [
      {
        "icon": "cart",
        "title": "Shopping Cart",
        "description": "Persistent item cart"
      }
    ],
    "isFeatured": true,
    "status": "published"
  }
  ```

- **Response (201 Created)**:
  *(Returns the created Project object complete with relations)*

---

#### Project Modification

##### DTO Models

- All fields of Project Creation are available but optional. Passing `image: null` will delete the associated project image and files.

##### Routes

###### `PUT /projects/:id`

Updates a project fields.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Request Body**:

  ```json
  {
    "title": "Updated E-Commerce Web Application",
    "isFeatured": false
  }
  ```

- **Response (200 OK)**:
  *(Returns the updated Project object)*

###### `PATCH /projects/:id/featured`

Toggles the `isFeatured` boolean status of a project.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:
  *(Returns the updated Project object complete with relations, including image)*

###### `DELETE /projects/:id`

Deletes a project and its associated image files from storage.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```

---

#### Project Image Upload

##### DTO Models

Uses standard `multipart/form-data` with binary payload.

##### Routes

###### `POST /projects/upload`

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

#### Contact Messages List

##### DTO Models

- `page` (int, optional, default: 1) -> Target page number.
- `pageSize` (int, optional, default: 10) -> Size of page.
- `filter` (enum, optional, default: `all`) -> Filter status. Supported values: `all`, `read`, `unread`.
- `search` (string, optional) -> Searches text inside name, email, and project brief.
- **Message Relation Details**:
  - `serviceType` (object) -> Selected service details containing `id` (enum, required: `web`, `mobile`, `mvp`, `ai`, `api`, `other`), `icon` (string, required), and `label` (string, required).
  - `priceRangeType` (object) -> Selected price range details containing `id` (string, required), `currency` (string, required), and `label` (string, required).

##### Routes

###### `GET /messages`

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

---

#### Unread Messages Count

##### DTO Models

No request DTOs required.

##### Routes

###### `GET /messages/unread-count`

Retrieves the total count of unread messages.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Response (200 OK)**:

  ```json
  {
    "count": 1
  }
  ```

---

#### Message Read Status

##### DTO Models

- `isRead` (boolean, required) -> Target read status.

##### Routes

###### `PATCH /messages/:id/read`

Marks a message read status.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `id` (int, required)
- **Request Body**:

  ```json
  {
    "isRead": true
  }
  ```

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

---

### 🗄️ Documents (`/documents`)

Manages document storage in a local Garage S3 cluster.

#### Upload Document

##### DTO Models

Multipart Form Data:

- `file` (binary, required) -> The file to upload. Allowed types: all document types.

##### Routes

###### `POST /documents/upload`

Uploads a document file to the Garage S3 storage bucket.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Request Body (multipart/form-data)**:
  - Form-data key `file` containing the file attachment.
- **Response (201 Created)**:

  ```json
  {
    "success": true,
    "url": "http://papanguesoft.web.garage.localhost:3902/1784225727335-F2100018.pdf",
    "name": "1784225727335-F2100018.pdf"
  }
  ```

---

#### List Documents

##### DTO Models

No request DTOs required.

##### Routes

###### `GET /documents`

Retrieves a list of all documents stored in the S3 bucket, sorted by their last modified date in descending order.

- **Auth Requirement**: Public (None)
- **Response (200 OK)**:

  ```json
  [
    {
      "name": "1784225727335-F2100018.pdf",
      "lastModified": "2026-07-16T18:15:27.000Z",
      "size": 66027,
      "url": "http://papanguesoft.web.garage.localhost:3902/1784225727335-F2100018.pdf"
    }
  ]
  ```

---

#### Delete Document

##### DTO Models

No request DTOs required.

##### Routes

###### `DELETE /documents/:name`

Deletes a specific document from the Garage S3 storage by its unique object name.

- **Auth Requirement**: `ApiAuthGuard` + `AdminGuard`
- **Route Params**: `name` (string, required) -> The unique name of the document.
- **Response (200 OK)**:

  ```json
  {
    "success": true
  }
  ```
