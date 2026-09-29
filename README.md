# Second Brain

A full-stack personal knowledge management app: save YouTube videos, tweets/X posts, documents, and links from across the web; organize them with tags; find them instantly with search; and share your whole collection with a single public link.

## Features

- **Four content types** — YouTube (normalized embed URLs), Twitter/X, documents, links — with edit and delete
- **Tags** — per-item chips, sidebar filter with live counts, autocomplete suggestions, orphan cleanup
- **Search** — header search plus a `Ctrl+K` / `Cmd+K` command palette (debounced, keyboard-navigable)
- **Two views** — Google Keep-style masonry grid (1–4 responsive columns) and a list view, with favorites pinned to the top
- **Share your brain** — public read-only link with live status, expiry countdown, in-place expiry change, hash regeneration, and revocation
- **Accounts** — signup with auto sign-in, JWT sessions with expiry handling, bcrypt password hashing, profile settings (username/password change, live stats, account deletion)
- **Polish** — dark/light theme (persisted), toasts, skeleton loaders, error boundary, accessible focus states, product-accurate landing page at `/landing`

## Tech stack

**Backend** (`brainly-backend/`)
- Node.js + Express 5, TypeScript (CommonJS, `tsc -b` build)
- MongoDB + Mongoose 9
- JWT auth (jsonwebtoken) + bcrypt
- zod-validated env config, helmet, express-rate-limit, pino structured logging
- Vitest + supertest + mongodb-memory-server (66 tests)

**Frontend** (`brainly-frontend/`)
- React 19 + React Router 7, TypeScript
- Vite 8, Tailwind CSS 4
- Axios client with interceptors, ESLint 10 (React Compiler rules)

## Repository structure

```
second-brain/
├── brainly-backend/    # Express + Mongoose API   → http://localhost:5000
└── brainly-frontend/   # React + Vite SPA         → http://localhost:5173
```

## Quick start

Prerequisites: Node.js 18+ (Node 24 recommended), npm, and a MongoDB database ([Atlas](https://www.mongodb.com/atlas) free tier or local).

**1. Backend**

```bash
cd brainly-backend
npm install
cp .env.example .env      # then fill in MONGO_URL and JWT_PASSWORD
npm run dev               # http://localhost:5000
```

**2. Frontend** (second terminal)

```bash
cd brainly-frontend
npm install
npm run dev               # http://localhost:5173
```

No frontend `.env` is needed in dev — `VITE_BACKEND_URL` falls back to `http://localhost:5000`, which is already in the backend's default CORS allowlist.

## Backend

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with tsx watch |
| `npm run build` | TypeScript build → `dist/` |
| `npm start` | Run the compiled server (`node dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Full vitest suite (66 tests, in-memory MongoDB) |

### Environment variables

Validated at startup with zod — the process refuses to boot with an invalid config.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGO_URL` | yes | — | MongoDB connection string |
| `JWT_PASSWORD` | yes | — | JWT signing secret (32+ random chars in production) |
| `PORT` | no | `5000` | Listen port |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime (zeit/ms format: `60s`, `15m`, `24h`, `7d`) |
| `CORS_ORIGINS` | no | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated browser origins allowed by CORS |
| `LOG_LEVEL` | no | `info` | `fatal`…`trace` \| `silent` |
| `RATE_LIMIT_DISABLED` | no | `false` | Disable rate limiting (used by the test suite) |

### API (all routes under `/api/v1`)

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /signup` | — | Create account (username 3–20 chars, password ≥ 6); returns a JWT — auto sign-in |
| `POST /signin` | — | Get a JWT (`{token, username}`); unified 401 on failure |
| `GET /content` | JWT | List own content, newest first, tags populated |
| `POST /content` | JWT | Create item (`title`, `link`, `type`, `tags?`) |
| `PUT /content` | JWT | Update item (`contentId` + fields) |
| `DELETE /content` | JWT | Delete item (`contentId`) |
| `POST /brain/share` | JWT | Enable/update share link (`share`, `expiresIn` minutes, `regenerate` rotates the hash — expiry changes keep it) |
| `GET /brain/share` | JWT | Share status (`{share, hash, expiresAt, createdAt}`) |
| `DELETE /brain/share` | JWT | Revoke the share link (idempotent) |
| `GET /brain/:sharelink` | — | Public read-only brain (410 when expired) |
| `GET /profile` | JWT | Account overview + stats |
| `PATCH /profile` | JWT | Change username (case-insensitive duplicate check) |
| `POST /profile/password` | JWT | Change password (`currentPassword`, `newPassword`) |
| `DELETE /profile` | JWT | Delete account (`password` confirmation; cascades content/tags/share link) |
| `GET /search?q=` | JWT | Search title/link/type (≤ 10 results) |
| `GET /tags` | JWT | Own tags with usage counts |
| `DELETE /tags` | JWT | Delete tag + remove it from items (`tagId`) |
| `GET /health` | — | `{status, uptime, database}` — readiness probe |

Send the JWT as `Authorization: <token>` (a `Bearer ` prefix is also accepted). Errors always look like `{ "message": "…" }`. **401 is reserved for token problems** (the client signs out on it); a mistyped confirmation password on `/profile` endpoints returns **403** so it never triggers a session-expired logout.

### Security & ops

helmet · CORS allowlist · rate limiting (300 req/15 min global, 20 req/15 min on auth) · bcrypt (cost 10, timing-equalized signin) · zod validation on every write · 1 MB body cap · structured pino logs · graceful shutdown · `/health` for orchestrators.

## Frontend

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Type-check (`tsc -b`) + production build → `dist/` |
| `npm run preview` | Preview a production build |
| `npm run lint` | ESLint (incl. React Compiler rules) |

### Environment variables (build time)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:5000` | Backend origin the SPA calls. Empty = same-origin (used behind a reverse proxy) |
| `VITE_APP_URL` | `window.location.origin` | Public origin baked into generated share links |

### Routes

| Path | Page |
|---|---|
| `/signin`, `/signup` | Auth |
| `/dashboard` | Main app (auth-guarded) |
| `/settings` | Profile settings (auth-guarded) |
| `/brain/:sharelink` | Public shared brain (read-only) |
| `/landing` | Marketing landing page |
| `/` | Redirects by session state (logged out → `/landing`) |
| `*` | Not found |

## Testing

```bash
cd brainly-backend
npm test
```

66 tests: vitest + supertest against a real in-memory MongoDB (mongodb-memory-server). The suite is fully hermetic — it never touches a real database, so it is safe to run anywhere.

## Deployment

Target topology: **frontend on Vercel** (static hosting), **backend on Render** (long-running Node process), **MongoDB Atlas** as the database. $0/month on free tiers.

### Backend → Render

1. Render → New → Web Service → connect this repo → set **root directory: `brainly-backend`**
2. Build command: `npm ci && npm run build` · Start command: `npm start` · health check path: `/health`
3. Environment: `MONGO_URL`, `JWT_PASSWORD` (long random), `CORS_ORIGINS=https://<your-app>.vercel.app`
4. Deploy and note the service URL: `https://<your-api>.onrender.com`

### Frontend → Vercel

1. Vercel → Add New Project → import the **same repo** → set **root directory: `brainly-frontend`** (Vite is auto-detected; `vercel.json` is already in that folder)
2. Environment: `VITE_BACKEND_URL=https://<your-api>.onrender.com`, `VITE_APP_URL=https://<your-app>.vercel.app`
3. Deploy. `vercel.json` rewrites every path to `index.html`, so client-side routes (`/brain/:hash`, `/settings`, …) survive refreshes and deep links.

### Wiring the two together

The browser's same-origin policy makes this order matter: after the Vercel deploy, set the backend's `CORS_ORIGINS` to exactly the Vercel origin (`https://<your-app>.vercel.app`) and save — Render auto-redeploys on env changes. If login fails with a CORS/network error on the live site, this variable is almost always the culprit.

### Free-tier note

Render's free tier sleeps the service after ~15 minutes of inactivity; the first request after that takes 30–60 s while it wakes. If that gets annoying, a free UptimeRobot monitor pinging `/health` every 5 minutes keeps it awake.

## Version history

- **v2.0 (2026-09-29)** — Production hardening + SaaS experience: zod env validation, helmet, rate limiting, structured logging, graceful shutdown, 66-test suite; tags; share-link lifecycle (status/countdown/expiry/regenerate/revoke); profile settings page; auto sign-in after signup; deploy-safe share URLs (`VITE_APP_URL` + `vercel.json`); masonry grid; single product-accurate landing page.
- **v1.1 (2026-09-18)** — Content type filters, tags groundwork, public shared-brain page, loading/error/empty states, delete confirmation, environment-variable config.
- **v1.0** — Initial learning build: JWT auth + content CRUD + card grid.

## License

ISC — a personal learning project.
