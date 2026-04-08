# SIERRA - Wealth Management Dashboard

SIERRA is a fullstack personal finance platform for tracking expenses, analyzing investment performance, and presenting actionable financial insights in a premium dashboard experience.

It combines a modern React frontend with an Express + MongoDB backend for secure, data-driven money management workflows.

## Features

- Portfolio allocation chart (donut)
- P&L analysis chart with Top/Worst/All views
- Purchase vs current price comparison chart
- Interactive SVG charts with hover and selection states
- Authenticated backend APIs for users and expenses

## Tech Stack

- Frontend: React, Vite, TypeScript
- Styling: Tailwind CSS + custom CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT + bcrypt

## Repository Structure

```text
Sierra/
|-- backend/          # Express API + MongoDB models/services
|-- frontend/         # React dashboard app
|-- docs/             # Architecture and project docs
|-- .env.example      # Root environment template
`-- README.md
```

## Screenshots

Add screenshots before publishing:

- Dashboard overview: `docs/screenshots/dashboard.png`
- Portfolio graphs: `docs/screenshots/portfolio-graphs.png`
- Expense flow: `docs/screenshots/expenses.png`

## Installation

1. Clone repository

```bash
git clone <your-repo-url>
cd Sierra
```

2. Install dependencies

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

3. Configure environment variables

```bash
# Root-level template (optional reference)
cp .env.example .env

# Backend runtime variables
cp backend/.env.example backend/.env

# Frontend runtime variables
cp frontend/.env.example frontend/.env
```

Update values as needed for your environment.

## Run in Development

Backend:

```bash
npm --prefix backend run dev
```

Frontend:

```bash
npm --prefix frontend run dev
```

Optional root helper scripts:

```bash
npm run dev:backend
npm run dev:frontend
```

## Build

Frontend production build:

```bash
npm --prefix frontend run build
```

Backend production start:

```bash
npm --prefix backend run start
```

## Future Improvements

- Add CI workflows for lint/build/test checks
- Add chart snapshot and interaction tests
- Add Dockerized local development
- Add centralized environment validation at startup
- Add deployment playbooks for frontend and backend

## License

ISC (update as needed for your release).
