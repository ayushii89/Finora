# Sierra API Documentation

Base URL: `http://localhost:5000`

Protected routes require header:

`Authorization: Bearer <JWT_TOKEN>`

---

## Health

### GET `/api/health`

- Auth: No
- Description: Basic API health check

Response example:

```json
{
  "success": true,
  "message": "Sierra API is running"
}
```

---

## Auth

### POST `/api/auth/register`

- Auth: No
- Description: Register a new account

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "currency": "INR"
}
```

Success response (201):

```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "currency": "INR",
      "monthlyBudget": 0,
      "createdAt": "2026-03-31T10:00:00.000Z",
      "updatedAt": "2026-03-31T10:00:00.000Z"
    },
    "token": "JWT_TOKEN"
  }
}
```

### POST `/api/auth/login`

- Auth: No
- Description: Login with email and password

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Success response (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "currency": "INR",
      "monthlyBudget": 0,
      "createdAt": "2026-03-31T10:00:00.000Z",
      "updatedAt": "2026-03-31T10:00:00.000Z"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## User

### GET `/api/user/me`

- Auth: Yes
- Description: Get current authenticated user profile

Success response (200):

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "_id": "USER_ID",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "INR",
    "monthlyBudget": 250000,
    "createdAt": "2026-03-31T10:00:00.000Z",
    "updatedAt": "2026-03-31T10:10:00.000Z"
  }
}
```

### PATCH `/api/user/budget`

- Auth: Yes
- Description: Update monthly budget

Request body:

```json
{
  "monthlyBudget": 250000
}
```

Success response (200):

```json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": {
    "_id": "USER_ID",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "INR",
    "monthlyBudget": 250000,
    "createdAt": "2026-03-31T10:00:00.000Z",
    "updatedAt": "2026-03-31T10:10:00.000Z"
  }
}
```

---

## Expenses

### POST `/api/expenses`

- Auth: Yes
- Description: Create expense

Request body:

```json
{
  "amount": 35000,
  "category": "FOOD",
  "date": "2026-03-31T00:00:00.000Z",
  "notes": "Weekend groceries"
}
```

Success response (201):

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "_id": "EXPENSE_ID",
    "user": "USER_ID",
    "amount": 35000,
    "category": "FOOD",
    "date": "2026-03-31T00:00:00.000Z",
    "notes": "Weekend groceries",
    "createdAt": "2026-03-31T10:20:00.000Z",
    "updatedAt": "2026-03-31T10:20:00.000Z"
  }
}
```

### GET `/api/expenses`

- Auth: Yes
- Description: List expenses with pagination and optional category filter

Query params:

- `page` (optional, default `1`)
- `limit` (optional, default `10`)
- `category` (optional, e.g. `FOOD`)

Success response (200):

```json
{
  "success": true,
  "message": "Expenses fetched successfully",
  "data": {
    "expenses": [
      {
        "_id": "EXPENSE_ID",
        "user": "USER_ID",
        "amount": 35000,
        "category": "FOOD",
        "date": "2026-03-31T00:00:00.000Z",
        "notes": "Weekend groceries",
        "createdAt": "2026-03-31T10:20:00.000Z",
        "updatedAt": "2026-03-31T10:20:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### DELETE `/api/expenses/:id`

- Auth: Yes
- Description: Delete an owned expense

Success response (200):

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": null
}
```

### GET `/api/expenses/summary`

- Auth: Yes
- Description: Monthly summary with budget comparison

Query params:

- `month` (required, `1-12`)
- `year` (required, e.g. `2026`)

Success response (200):

```json
{
  "success": true,
  "message": "Expense summary fetched successfully",
  "data": {
    "totalExpenses": 120000,
    "monthlyBudget": 250000,
    "remaining": 130000,
    "status": "SAFE",
    "byCategory": [
      { "category": "FOOD", "total": 50000 },
      { "category": "TRAVEL", "total": 70000 }
    ],
    "weeklyTrend": [
      { "week": 12, "total": 30000 },
      { "week": 13, "total": 90000 }
    ]
  }
}
```
