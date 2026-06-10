# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

VHF e Superiori is a website/community platform for an amateur radio (ham radio) association. It's a pnpm monorepo with three packages:

- `backend/` — Express + TypeScript + MongoDB (Typegoose) REST API
- `frontend/` — React 18 (JS/JSX, Vite, Tailwind, Flowbite, Material Tailwind)
- `frontend/server/` — Express server (vite-express) that serves the built frontend in production

## Commands

Run from the repo root using pnpm workspace filters.

```bash
pnpm install                  # install all workspace deps

pnpm dev                       # run backend + frontend + frontend-server in parallel
pnpm dev:backend                # backend only (nodemon + ts-node, watches src/)
pnpm dev:frontend                # frontend only (vite dev server, port 3000, proxies /api -> :6961)
pnpm dev:frontend-server          # frontend-server only

pnpm build                     # build all packages
pnpm build:backend               # tsc compile backend to backend/build
pnpm build:frontend               # vite build, outputs to frontend/server/dist

pnpm serve-frontend             # build frontend then start frontend-server (production-style)
pnpm start:backend                # build then run backend/build/index.js
pnpm start:frontend-server         # run frontend-server (expects frontend already built)

pnpm check                     # biome check --fix (lint + format, whole repo)
pnpm check:staged               # biome check --staged (used by husky pre-commit)
```

There is no test suite configured (no `test` script in any package, no test files). `supertest`/`ts-node` are present as devDependencies in the backend but unused for tests currently.

Linting/formatting is done with **Biome** (`biome.json` at repo root) — it covers JS/TS/JSX/CSS/HTML. Pre-commit runs `pnpm check:staged` via husky. Notable rule choices: double quotes, `noNonNullAssertion` off, `useImportType` off, `useUniqueElementIds`/`noNestedComponentDefinitions`/`noUndeclaredDependencies` off, `noUndeclaredVariables` error.

The backend requires `ffmpeg`, `libvips-dev`, and `imagemagick` system packages (used for media/QSL card processing).

## Backend architecture (`backend/src`)

- `index.ts` → loads dotenv and imports `./api`.
- `api/index.ts` is the real entrypoint: imports `shared` (env validation + logger), `db` (mongoose connection), `auth`, `config`, `mailjet`, then calls `createServer()` from `api/utils/server.ts` and starts listening on `IP:PORT`.
- `api/utils/server.ts` mounts `/api` → `apiRoutes`, serves Swagger docs at `/api-docs` outside production, and returns a 404 JSON error for everything else.
- `api/utils/apiRoutes.ts` is the central router: sets up morgan logging (via `LoggerStream`/`logger`), body-parser, cookie-parser, `populateUser` (attaches `req.user` from JWT), `impersonate` (admin "log in as another user" via `x-impersonate-user` header), and `express-fileupload` (100MB limit, max 7 files per field, 300MB hard cap, temp files under `BASE_TEMP_DIR`). It then mounts each feature router under `/api/<feature>`.
- `shared/envs.ts` validates all required env vars at startup with `envalid` (process exits if any are missing) — see this file for the full list of required configuration (Mongo, JWT/cookie secrets, QRZ, Mailjet/SMTP, AWS S3, Google Maps, Telegram bot, Turnstile captcha, temp dirs, etc).

### Feature module pattern (`api/<feature>/`)

Each feature follows the same shape:
- `models/` — Typegoose classes (`@modelOptions`/`@prop` decorators) with embedded `@swagger` JSDoc component schemas
- `schemas/` — `express-validator` `Schema` objects (`createSchema.ts`, `updateSchema.ts`) used with the shared `validate` helper; sanitization (e.g. DOMPurify via jsdom for HTML fields) happens here
- `routes/` — one file per HTTP verb/operation (`get.ts`, `all.ts`, `create.ts`, `update.ts`, `delete.ts`, `upload.ts`...), each exporting an Express `Router`, composed in `routes/index.ts` with appropriate middleware (e.g. `isAdmin` for mutating routes)
- Routes use `@openapi` JSDoc comments for Swagger generation (`api/docs/specs.ts`)

New features should be wired into `api/utils/apiRoutes.ts` under `/api/<name>`.

### Auth & permissions

- JWT-based auth via passport (`passport-jwt`, `passport-local`), populated onto `req.user` by `populateUser` middleware.
- Role/flag checks live in `api/middlewares/`: `isAdmin`, `isVerified`, `isDev`, `isLoggedIn`. The `UserClass` model (`api/auth/models/User.ts`) has boolean flags like `isAdmin`, `isVerified`/etc — check this model for the full set of roles before adding new permission checks.
- `impersonate` middleware lets an admin act as another user via the `x-impersonate-user` request header (set automatically by the frontend axios interceptor when impersonation is active).
- Errors are centralized in `api/errors/errors.ts` (an `Errors` enum/object) and returned via the `createError()` helper (`{ err, ...extra }` shape) with appropriate `http-status` codes.

### Other notable backend modules

- `api/jobs/` — cron jobs (`cron` package), registered via side-effect import (`import "../jobs"`) in `apiRoutes.ts`
- `api/mailjet/`, `api/email/`, `api/telegram/` — outbound notification channels (Mailjet for transactional/marketing email, SMTP via nodemailer, Telegram bot for error/admin alerts)
- `api/aws/` — S3 client/presigner for file storage
- `api/qrz/`, `api/adif/`, `api/qso/`, `api/eqsl/` — amateur radio specific domain logic (QRZ.com lookups, ADIF log import/export, QSO records, eQSL card generation)
- `api/map/`, `api/location/` — geo/maps features (Google Maps API, geolib)
- `api/backup/` — mongodump-based backup routes

## Frontend architecture (`frontend/src`)

- Entry: `main.jsx` → `index.jsx`, which sets up `BrowserRouter`/`Routes` (react-router v7), i18next, GA4 page tracking, react-cookie, and a Material Tailwind `ThemeProvider`.
- Top-level layout/shared components live directly under `src/`: `App.jsx` (provides `EventsContext`, `JoinOpenContext`, `ViewsContext`, `SidebarOpenContext`), `Layout.jsx`, `Header.jsx`, `Footer.jsx`, `SplashLoader.jsx`/`Splash.jsx`.
- Feature folders (each roughly maps to a section of the site and a backend feature): `admin/`, `auth/`, `event/`, `blog/`, `social/`, `beacon/`, `profile/`, `map/`, `document/`, `antenna/`.
- `stores/` — Zustand stores (plain `.js`, with `persist` middleware), notably `userStore.js` (auth state: `user` is `false` while loading, `null` if unauthenticated, or the user object; also handles impersonation state). An axios request interceptor in `index.jsx` reads `impersonatedUserId` from this store and sets the `x-impersonate-user` header on every request.
- `shared/` — reusable components/utilities used across features (map containers, formatting helpers, loading placeholders, etc).
- `i18n/` — i18next setup (multi-language support, language detector + HTTP backend).
- Vite dev server proxies `/api/*` to the backend at `http://localhost:6961` (see `frontend/vite.config.js`); production build output goes to `frontend/server/dist` and is served by `frontend/server` (vite-express + helmet).
- Code is mostly `.jsx`/`.js` (not TypeScript), styled with Tailwind CSS + Flowbite/Material Tailwind components.
