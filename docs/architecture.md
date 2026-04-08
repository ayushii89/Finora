# SIERRA Architecture

## 1) High-Level System Overview

SIERRA is a fullstack personal finance dashboard with two primary applications:

- Frontend: React + Vite + TypeScript application for authentication, dashboarding, portfolio analysis, and interactive charts.
- Backend: Node.js + Express + MongoDB API that handles authentication, user profile data, and expense APIs.

The frontend consumes backend APIs for auth and expense workflows, while portfolio visualization is rendered client-side from persisted browser state.

## 2) Folder Structure Explanation

```text
Sierra/
|-- backend/
|   |-- src/
|   |   |-- app.js                # Express app wiring and middleware
|   |   |-- server.js             # App bootstrap and startup lifecycle
|   |   |-- config/               # Environment and database config
|   |   |-- middleware/           # Auth and error middleware
|   |   |-- modules/              # Domain modules (auth, user, expense)
|   |   `-- utils/                # Shared API helpers and error wrappers
|   |-- API_DOCS.md
|   |-- ARCHITECTURE.md
|   `-- README.md
|-- frontend/
|   |-- src/
|   |   |-- App.tsx               # Routing and app shell
|   |   |-- context/              # Auth context and session state
|   |   |-- components/           # Shared UI including PortfolioGraph
|   |   |-- pages/                # Feature pages (Dashboard, Investments, etc.)
|   |   `-- lib/                  # API request helpers
|   `-- index.css                 # Global styles and animation utilities
|-- docs/
|   `-- architecture.md           # Repository-level architecture overview
`-- README.md                     # Top-level project guide
```

## 3) Data Flow (Frontend -> Backend -> Rendering)

1. User actions in frontend pages trigger API requests through `frontend/src/lib/api.ts`.
2. Backend Express routes process requests in module layers:
   - route -> controller -> service -> model.
3. MongoDB persistence is handled via Mongoose models in backend modules.
4. API responses return normalized JSON payloads.
5. Frontend updates local state/context and re-renders UI.

Portfolio graph rendering is fully SVG-based in the frontend and relies on in-memory/localStorage portfolio data prepared in page-level state.

## 4) PortfolioGraph Component (Core Visualization)

`frontend/src/components/PortfolioGraph.tsx` is a reusable graph system used by both Dashboard and Investments pages.

It supports:

- Allocation mode: donut-style SVG chart for composition view.
- P&L mode: SVG bar chart for gain/loss analysis with filtering modes.
- Comparison mode: grouped SVG bars comparing purchase price and current price.

Key design goals:

- Reusability across pages.
- No charting libraries.
- Pure SVG rendering with controlled interactions.

## 5) State Handling Approach

State is layered by concern:

- Auth/session state: `AuthContext` + localStorage.
- Page data state: page-local `useState`/`useMemo` for derived datasets.
- Visualization interaction state: component-local state in `PortfolioGraph` (mode, hover, selection, tooltip).

This approach keeps business data logic separate from presentation and interaction behavior.

## 6) Graph Rendering Strategy (SVG-Based)

All charts in `PortfolioGraph` are built with SVG primitives (`path`, `rect`, `line`, `text`) and computed geometry.

Benefits:

- Precise visual control over bars/slices/grid/labels.
- Lightweight runtime without chart-library overhead.
- Consistent interactive behaviors (hover, selection, tooltip, transitions) implemented directly in React + SVG.
