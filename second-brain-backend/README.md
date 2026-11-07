# Second Brain — Backend API

Node.js + Express + MongoDB API for Second Brain, a personal knowledge ("second brain") app. See **`../PROJECT_DOCUMENTATION.md`** for the complete product & engineering documentation (API reference, data models, security model, deployment).

## Quick start

```bash
npm install
cp .env.example .env     # fill in MONGO_URL and JWT_PASSWORD
npm run dev              # http://localhost:5000
```

Production:

```bash
npm run build && npm start
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | tsx watch dev server |
| `npm run build` | TypeScript build → `dist/` |
| `npm start` | Run compiled server (`node dist/index.js`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Full vitest suite (66 tests, in-memory MongoDB) |

## Environment

All variables are validated at startup (zod) — the process refuses to boot with an invalid config. See `.env.example`: `MONGO_URL` and `JWT_PASSWORD` are required; `PORT` (default 5000), `JWT_EXPIRES_IN` (default 7d), `CORS_ORIGINS`, `LOG_LEVEL`, `RATE_LIMIT_DISABLED` (tests only) are optional. Use a 32+ character random `JWT_PASSWORD` in production.

## API (all routes under `/api/v1`)

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /signup` | — | Create account (username 3–20 chars, password ≥ 6); returns `{message, token, username}` — auto sign-in |
| `POST /signin` | — | Get JWT (`{token, username}`); unified 401 on failure |
| `GET /content` | JWT | List own content, newest first, tags populated |
| `POST /content` | JWT | Create item (`title`, `link`, `type`, `tags?`) |
| `PUT /content` | JWT | Update item (`contentId` + fields) |
| `DELETE /content` | JWT | Delete item (`contentId`) |
| `POST /brain/share` | JWT | Enable/update share link (`share`, `expiresIn` minutes, `regenerate` to rotate the hash — expiry changes keep it) |
| `GET /brain/share` | JWT | Share status (`{share, hash, expiresAt, createdAt}`) |
| `DELETE /brain/share` | JWT | Revoke the share link (idempotent) |
| `GET /brain/:sharelink` | — | Public read-only brain (410 when expired) |
| `GET /profile` | JWT | Account overview + stats (`{username, createdAt, stats:{contents, tags}}`) |
| `PATCH /profile` | JWT | Change username (case-insensitive duplicate check) |
| `POST /profile/password` | JWT | Change password (`currentPassword`, `newPassword`) |
| `DELETE /profile` | JWT | Delete account (`password` confirmation; cascades content/tags/share link) |
| `GET /search?q=` | JWT | Search title/link/type (≤ 10 results) |
| `GET /tags` | JWT | Own tags with usage counts |
| `DELETE /tags` | JWT | Delete tag + remove from items (`tagId`) |
| `GET /health` | — | `{status, uptime, database}` |

Send the JWT as `Authorization: <token>` (a `Bearer ` prefix is also accepted). Errors always look like `{ "message": "…" }`. **401 is reserved for token problems** (the client signs out on it); a mistyped confirmation password on `/profile` endpoints returns **403**.

## Security & ops

helmet · CORS allowlist · rate limiting (300/15 min global, 20/15 min on auth) · bcrypt (cost 10, timing-equalized signin) · zod validation on every write · 1 MB body cap · structured pino logs · graceful shutdown · `/health` for orchestrators.

## Tests

```bash
npm test   # vitest + supertest + mongodb-memory-server — 66/66 passing
```

## Docker (deferred)

The Docker stack was built, then set aside on 2026-09-29 — the files were removed from the repo. The complete design (multi-stage image, compose stack, health-gated startup) is preserved in `../PROJECT_DOCUMENTATION.md` §13 if it's ever needed again.

## License

ISC
