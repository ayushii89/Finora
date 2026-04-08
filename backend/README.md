# Sierra Backend API

Production-ready backend API for Sierra, a personal finance platform focused on secure authentication, expense tracking, and budget-aware spending analytics.

## Features

- JWT authentication (`register`, `login`)
- Protected user profile APIs (`/api/user/me`, `/api/user/budget`)
- Expense management (`create`, `list`, `delete`)
- Ownership-based secure deletion for expenses
- Expense listing with pagination and category filtering
- Monthly expense summary with:
	- total expenses
	- category breakdown
	- weekly trend
	- budget status (`SAFE`, `WARNING`, `OVERSPENT`)
- Centralized error handling with consistent API responses

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)

## Folder Structure

```text
Sierra/
|-- src/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |   |-- env.js
|   |   `-- db.js
|   |-- middleware/
|   |   |-- auth.middleware.js
|   |   `-- errorHandler.js
|   |-- utils/
|   |   |-- ApiError.js
|   |   |-- ApiResponse.js
|   |   `-- catchAsync.js
|   `-- modules/
|       |-- auth/
|       |   |-- auth.model.js
|       |   |-- auth.service.js
|       |   |-- auth.controller.js
|       |   `-- auth.routes.js
|       |-- user/
|       |   |-- user.service.js
|       |   |-- user.controller.js
|       |   `-- user.routes.js
|       `-- expense/
|           |-- expense.model.js
|           |-- expense.service.js
|           |-- expense.controller.js
|           `-- expense.routes.js
|-- .env.example
|-- API_DOCS.md
|-- ARCHITECTURE.md
|-- PRD.md
`-- README.md
```

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your local values.

4. Run in development:

```bash
npm run dev
```

5. Run in production mode:

```bash
npm start
```

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/sierra` |
| `JWT_SECRET` | JWT signing secret | `your_jwt_secret` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |

## API Endpoints Overview

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register account |
| `POST` | `/api/auth/login` | No | Login account |
| `GET` | `/api/user/me` | Yes | Current user profile |
| `PATCH` | `/api/user/budget` | Yes | Update monthly budget |
| `POST` | `/api/expenses` | Yes | Create expense |
| `GET` | `/api/expenses` | Yes | List expenses with pagination/filter |
| `DELETE` | `/api/expenses/:id` | Yes | Delete owned expense |
| `GET` | `/api/expenses/summary` | Yes | Monthly expense summary |

## Example Requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{
		"name": "John Doe",
		"email": "john@example.com",
		"password": "password123",
		"currency": "INR"
	}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
	-H "Content-Type: application/json" \
	-d '{
		"email": "john@example.com",
		"password": "password123"
	}'
```

### Create Expense (Protected)

```bash
curl -X POST http://localhost:5000/api/expenses \
	-H "Authorization: Bearer <TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{
		"amount": 25000,
		"category": "food",
		"notes": "groceries"
	}'
```

### Get Expenses with Pagination + Filter (Protected)

```bash
curl "http://localhost:5000/api/expenses?page=1&limit=10&category=FOOD" \
	-H "Authorization: Bearer <TOKEN>"
```

### Get Monthly Summary (Protected)

```bash
curl "http://localhost:5000/api/expenses/summary?month=3&year=2026" \
	-H "Authorization: Bearer <TOKEN>"
```

