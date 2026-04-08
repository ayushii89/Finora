# Sierra Backend Architecture

## Overview

Sierra backend uses a modular MVC-inspired architecture in Node.js + Express with clear separation between HTTP handling, business logic, and persistence.

## Folder Structure and Responsibility

- `src/config`
  - Environment and database connection setup.
- `src/middleware`
  - Cross-cutting concerns such as authentication and global error handling.
- `src/utils`
  - Shared primitives for standardized success/error responses and async wrapping.
- `src/modules/auth`
  - Authentication domain (`model`, `service`, `controller`, `routes`).
- `src/modules/user`
  - User profile and budget domain.
- `src/modules/expense`
  - Expense creation, listing, deletion, and summary analytics.

## Request Flow

1. Client sends HTTP request to Express route.
2. Route applies middleware (for protected routes, `protect` validates JWT).
3. Controller extracts request data and calls a service function.
4. Service executes business logic and database operations.
5. Service returns raw data (no HTTP response formatting).
6. Controller returns standardized success payload via `ApiResponse.success`.
7. Any thrown errors are passed to centralized `errorHandler` middleware.

## Separation of Concerns

- Routes: endpoint definitions and middleware wiring only.
- Controllers: HTTP-level orchestration only (`req`, `res`, status codes, messages).
- Services: business rules and database interactions only.
- Models: data shape, schema validation, indexes, and model methods.
- Middleware: authentication and global error transformation.

This structure keeps modules testable, maintainable, and easy to extend.

## Security Decisions

- JWT authentication for protected APIs.
- Route protection via `protect` middleware.
- Expense deletion is ownership-scoped (`_id + user`) to prevent cross-user access.
- Password hashing using `bcryptjs` with strong salt rounds.
- Password excluded from query responses by default.
- Centralized error responses to avoid leaking internal stack details in API output.
