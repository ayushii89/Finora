# Product Requirements Document (PRD)

## Product

Sierra Backend API

## Problem Statement

Users need a secure and reliable backend to manage day-to-day expenses, monitor monthly budgets, and get actionable spending insights without manual tracking overhead.

## Target Users

- Students and early-career professionals managing monthly budgets.
- Working professionals who need clear spending visibility by category and time.
- Hackathon judges/recruiters evaluating architecture and API quality.

## Core Features

1. Authentication
   - Register and login with JWT-based access.
2. User Profile
   - Fetch current user profile.
   - Update monthly budget.
3. Expense Management
   - Create expense entries.
   - List expenses with pagination and category filters.
   - Delete expenses securely with ownership checks.
4. Expense Analytics
   - Monthly summary of total spend.
   - Category-wise totals.
   - Weekly spend trend.
   - Budget status (`SAFE`, `WARNING`, `OVERSPENT`).

## User Flows

### 1. Registration and Login

1. User registers with name/email/password.
2. API returns JWT token and user profile.
3. User logs in on subsequent sessions to receive a fresh token.

### 2. Budget Setup

1. Authenticated user updates monthly budget.
2. Budget value is stored on the user profile.

### 3. Expense Tracking

1. User adds expense with amount/category/date/notes.
2. User views expenses with pagination and optional category filter.
3. User deletes owned expenses if needed.

### 4. Summary Review

1. User requests monthly summary by `month` and `year`.
2. API returns totals, breakdowns, and budget comparison indicators.

## Non-Functional Requirements

- Consistent response contract across APIs.
- Secure-by-default protected routes.
- Clear modular code organization for maintainability.
- Production-safe validation and centralized error handling.

## Future Scope

- Expense update endpoint.
- Recurring expenses and reminders.
- Multi-currency reporting and conversion.
- Dashboard-level insights (month-over-month trends).
- Role-based admin analytics.
