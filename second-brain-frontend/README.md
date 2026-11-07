# Second Brain — Frontend

React 19 + Vite + Tailwind CSS 4 SPA for Second Brain, a personal knowledge ("second brain") app. See **`../PROJECT_DOCUMENTATION.md`** for the complete product & engineering documentation (routes, patterns, build output, deployment).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (expects the API on http://localhost:5000)
```

No `.env` is needed in dev — `VITE_BACKEND_URL` falls back to `http://localhost:5000`, which is already in the backend's CORS allowlist. An empty value is also meaningful: it makes the app call the API same-origin — the trick behind the proxy topology documented in `../PROJECT_DOCUMENTATION.md` §13.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Type-check (`tsc -b`) + production build → `dist/` |
| `npm run preview` | Preview a production build |
| `npm run lint` | ESLint (incl. React Compiler rules) |

## Features

- Signup (auto sign-in — goes straight to the dashboard) / signin with JWT session handling (auto sign-out + banner when a session expires), sidebar account menu with logout
- Content of 4 types — YouTube (normalized embed URLs), Twitter/X, documents, links — with edit & delete
- Tags: per-item chips, sidebar tag filter, autocomplete suggestions
- Command palette (`⌘K` / `Ctrl+K`) with debounced search and keyboard navigation
- Share the whole brain via link — live status + remaining-time countdown, in-place expiry changes (hash kept), regenerate, revoke
- Settings page (`/settings`): live stats, username & password change, theme, account deletion
- Product-accurate landing page at `/landing` — built from the app's real design tokens and components
- Dark / light theme (persisted), masonry grid & list views, favorites, toasts, skeleton loaders, error boundary
- Public read-only shared-brain page (`/brain/:sharelink`)

## Routes

| Path | Page |
|---|---|
| `/signin`, `/signup` | Auth |
| `/dashboard` | Main app (auth-guarded) |
| `/settings` | Profile settings (auth-guarded) |
| `/brain/:sharelink` | Public shared brain |
| `/landing` | Marketing landing page (product-accurate) |
| `/landing/:variant` | Redirect → `/landing` (old A/B/C bookmarks don't 404) |
| `/` | Redirects by session state (logged out → `/landing`) |
| `*` | Not found |

## Project structure

```
src/
├── components/
│   ├── ErrorBoundary.tsx, RequireAuth.tsx
│   ├── ui/        # cards, modals, palette, sidebar, inputs, chips, toasts…
│   └── views/     # grid / list layouts
├── context/       # ThemeProvider (+ context definition split for lint)
├── hooks/         # ToastProvider, useToast, useTwitterWidgets
├── icons/         # inline SVG icons
├── lib/api.ts     # axios instance, interceptors, error helpers
├── pages/         # Signup, Signin, Dashboard, Settings, SharedBrain, NotFound
│                  # + landing/ (Landing.tsx — product-accurate marketing page)
├── utils/youtube.ts
├── App.tsx, main.tsx, config.ts, index.css
```

## Toolchain note

TypeScript 7 (native compiler, used by `tsc -b`) and TypeScript 6 (API used by typescript-eslint) are intentionally installed side-by-side — see §8.7 of `PROJECT_DOCUMENTATION.md` before changing `package.json`.

## Docker (deferred)

The Docker setup (nginx serving the built SPA with an `/api/` proxy) was removed from the repo on 2026-09-29 when container deployment was deferred. The full design is preserved in `../PROJECT_DOCUMENTATION.md` §13.

## Deploying (static host, e.g. Vercel)

`vercel.json` rewrites all paths to `index.html` so client-side routes (`/brain/:hash`, `/settings`, …) survive deep links and refreshes. Set both env vars in the host's dashboard:

- `VITE_BACKEND_URL=https://<your-api-host>` — backend origin
- `VITE_APP_URL=https://<your-app>.vercel.app` — public origin used when building share links

and add the deployed origin to the backend's `CORS_ORIGINS`.

## License

ISC
