# ERP & POS

A retail ERP/POS feature showcase built with a Next.js frontend, NestJS API, and PostgreSQL scaffold. The hosted prototype opens with sample data and keeps changes in the current browser session. The API and database are available for a later connected version.

## Run the stack

1. Copy `.env.example` to `.env`.
2. Replace `POSTGRES_PASSWORD` and `JWT_SECRET` with unique random values. For example, generate hex secrets with `openssl rand -hex 32`. Keep `COOKIE_SECURE=false` only for local HTTP development; set it to `true` on a VPS behind HTTPS.
3. Start the services:

   ```sh
   docker compose up --build -d
   ```

4. Open `http://localhost:3000` to explore the sample workspace. The current UI does not require the API or PostgreSQL; its changes stay in the current browser session.

The web container is the only public service. NestJS and PostgreSQL stay on the private Docker network; PostgreSQL has no published host port. The named `postgres_data` volume keeps database files across container rebuilds and `docker compose down`. The API and database are scaffolded for self-hosting, but the showcase UI currently runs client-side.

## Run services in development

Install each app's dependencies, then start PostgreSQL and the API:

```sh
npm install --prefix apps/web
npm install --prefix apps/api
docker compose up -d db
npm run start:dev --prefix apps/api
```

In a second terminal, set `API_SERVICE_URL=http://localhost:3001` for the web process and run `npm run dev --prefix apps/web`. The Next.js runtime proxy uses that URL to reach the local NestJS API. With PowerShell, set it with `$env:API_SERVICE_URL="http://localhost:3001"` first.

## VPS setup

Install Docker Engine and the Docker Compose plugin on the VPS. Copy the project and `.env.example` to `.env`, replace both example secrets with unique random values, and keep PostgreSQL's port private. Set `WEB_PORT` to the port your HTTPS reverse proxy will reach, then run:

```sh
docker compose up --build -d
```

Point Caddy, Nginx, or another TLS reverse proxy at the web service. The default web port is `3000`. Keep HTTPS enabled so the API's session cookie stays secure. Back up PostgreSQL regularly before upgrades or VPS changes.

## Project layout

- `apps/web`: Next.js App Router shell and existing ERP/POS interface.
- `apps/api`: NestJS authentication, workspace, team, and document API.
- `compose.yml`: web, API, and private PostgreSQL services.

The existing ERP pages still use their client-side router inside the Next.js catch-all route, preserving current screens and URLs while moving hosting and data access to the new stack.

The previous Supabase workspace is not imported automatically. Existing Supabase data remains in that project until you export and migrate it.

## Deploy to Vercel with Services

The repository includes a root `vercel.json` that deploys `apps/web` and `apps/api` in one Vercel Services project. Set the Vercel project's framework preset to **Services** and its root directory to the repository root. The `api` service runs from its Dockerfile; the `web` service is public, and its server-side `/api/*` proxy can reach the internal API through the `API_SERVICE_URL` binding. Vercel injects that binding at runtime; do not add it to Vercel's environment settings.

The current showcase UI does not call the API, so the prototype deployment needs no database or API credentials. A connected deployment will need `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, and a `JWT_SECRET` of at least 32 characters. Set `COOKIE_SECURE=true`; set `DATABASE_SSL=true` when the PostgreSQL endpoint requires TLS. The Compose database is private to the VPS network and is not reachable from Vercel by default. See the [Vercel Services guide](https://vercel.com/docs/services) for service configuration.
