# Frontend

React + Vite dashboard for infra-orchestrator. Talks to the backend in
`apps/backend` (Express + Prisma).

## Run it

```bash
pnpm --filter frontend dev      # http://localhost:5173
```

The dev server proxies `/auth`, `/project`, `/deployment` and `/health` to
`http://localhost:3000` (see `vite.config.ts`). The backend sends no CORS
headers, so the browser must stay on one origin. Point the proxy somewhere
else with `VITE_DEV_API_URL`.

For a production build set `VITE_API_URL` at build time, otherwise the app
talks to the origin it is served from:

```bash
VITE_API_URL=https://api.shipwebsite.tech pnpm --filter frontend build
```

| Variable            | Default                     | Meaning                                  |
| ------------------- | --------------------------- | ---------------------------------------- |
| `VITE_API_URL`      | same origin                 | Backend base URL                         |
| `VITE_DEPLOY_DOMAIN`| `deploy.shipwebsite.tech`   | Domain the deployed sites live on        |
| `VITE_DEV_API_URL`  | `http://localhost:3000`     | Proxy target for `pnpm dev`              |

## Layout

```
src/lib/types.ts     shapes returned by the backend (keep in sync with prisma/schema.prisma)
src/lib/api.ts       fetch wrapper, every backend call
src/lib/queries.ts   react-query hooks, one cache entry per resource
src/lib/utils.ts     path/date/env helpers
src/components/      shared UI (StatusBadge, ProtectedRoute)
src/pages/           landing page + dashboard
```

`["projects"]` and `["deployments"]` are the two cache entries. Every page
reads them, so the dashboard, the project page and the deployments list share
one request instead of fetching the same rows again. The deployments query
polls every 10 s while a build is pending or building, and stops when
nothing is running.

## What the backend expects (and where the frontend bends)

- **Project create and update** use two different shapes. Create has no `id`
  (the database assigns it) and needs `githubRepoId`, `name`, `repoUrl`,
  `rootDir`, `installCmd`, `buildCmd`, `outputDir`, `framework` and
  `envVars`. Update needs the same plus the `id` of the project.
  `projectPayload()` in `src/lib/utils.ts` builds the update body.
- **Deployments need a commit hash.** The backend does not expose one, so the
  frontend reads the head of the default branch from the public GitHub API and
  falls back to `HEAD` (the commit that was cloned) when GitHub is
  unreachable. Public repositories only, 60 requests per hour per IP.
- **Paths.** The executor rejects absolute paths and empty output
  directories, so `rootDir` and `outputDir` are normalised before they are
  sent. Projects stored before that normalisation still have `rootDir: "/"`
  and are corrected the first time they are deployed.

## Local login

`POST /auth/dev-login` exists on the backend for the seeded user. In dev the
landing page shows a "Dev login" button that uses it:

```bash
pnpm --filter backend exec prisma db seed
```
