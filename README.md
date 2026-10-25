# EcoTrack

EcoTrack is a demo ESG analytics dashboard for tracking synthetic energy, water, waste, and Scope 2 carbon metrics across five facilities. The application uses React in `client/` and Express in `server/`.

## Features

- Interactive resource trends, facility comparisons, and waste diversion metrics.
- Month-over-month KPI summaries and configurable statistical anomaly alerts.
- MongoDB persistence when `MONGODB_URI` is configured.
- Local JSON persistence for development without a database.

## Requirements

- Node.js 20 LTS or newer
- npm
- MongoDB is optional for local development. Production mode requires MongoDB.

## Run locally

Open two terminals from the project root.

### 1. Start the API

```powershell
cd server
npm ci
Copy-Item .env.example .env
npm run seed
npm start
```

The API is available at `http://localhost:5000`. With the example configuration it uses a local JSON file under `server/data/`; MongoDB credentials are not required.

### 2. Start the dashboard

```powershell
cd client
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the local API.

The Windows convenience launcher is `run_mern.bat`. Install both sets of dependencies and seed the database once before using it.

## Configuration

Copy `server/.env.example` to `server/.env` and configure:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (defaults to `5000`) |
| `NODE_ENV` | Set to `production` for deployment; production requires MongoDB and disables the destructive reseed endpoint |
| `MONGODB_URI` | Optional MongoDB connection string for local development; required in production |

Never commit `.env` files or real database credentials. Local generated data, build output, and installed dependencies are excluded through `.gitignore`.

## Development checks

Run backend tests:

```powershell
cd server
npm test
```

Build the frontend:

```powershell
cd client
npm run build
```

GitHub Actions runs both checks for pushes and pull requests.

## API

- `GET /api/health` — API health status
- `GET /api/metrics` — metrics with optional `startDate`, `endDate`, and `departments` filters
- `GET /api/metrics/bounds` — available date range
- `GET /api/metrics/departments` — supported facility names
- `GET /api/kpi/summary` — summary KPIs and month-over-month comparisons
- `GET /api/kpi/dashboard` — combined dashboard payload with one filtered data query
- `GET /api/kpi/departments` — facility breakdown
- `GET /api/kpi/waste` — waste diversion metrics
- `GET /api/kpi/anomalies` — anomaly list; `multiplier` must be between `1` and `4`
- `POST /api/metrics/seed` — regenerate the synthetic dataset (disabled in production)

Dates must use `YYYY-MM-DD`; invalid dates, reversed ranges, and unknown facility names return a `400` response.

## GitHub publishing

This repository contains both a frontend and a backend. GitHub Pages can host only the static frontend and cannot run the Express API or provide persistent storage. Publishing the source to GitHub does not make the app publicly available; a live deployment needs an application host and a MongoDB database.
