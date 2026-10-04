# ERP & POS

A self-hosted business management app with a Next.js frontend, NestJS API, and PostgreSQL database.

## Run the stack

1. Copy `.env.example` to `.env`.
2. Replace `POSTGRES_PASSWORD` and `JWT_SECRET` with unique random values. For example, generate hex secrets with `openssl rand -hex 32`. Keep `COOKIE_SECURE=false` only for local HTTP development; set it to `true` on a VPS behind HTTPS.
3. Start the services:

   ```sh
   docker compose up --build -d
   ```

4. Open `http://localhost:3000` and create the first account. It becomes the workspace owner. The app seeds sample ERP data for a new workspace.

The web container is the only public service. NestJS and PostgreSQL stay on the private Docker network; PostgreSQL has no published host port. The named `postgres_data` volume keeps database files across container rebuilds and `docker compose down`.

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

The repository includes a root `vercel.json` that deploys `apps/web` and `apps/api` in one Vercel Services project. Set the Vercel project's framework preset to **Services** and its root directory to the repository root. The `web` service is the only public service; it receives all paths and forwards `/api/*` requests to the internal `api` service using the `API_SERVICE_URL` service binding. Vercel injects that binding at runtime; do not add `API_SERVICE_URL` in Vercel's environment settings.

Set these environment variables for the Vercel deployment: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `JWT_SECRET` (at least 32 characters). Set `COOKIE_SECURE=true`; set `DATABASE_SSL=true` when the PostgreSQL endpoint requires TLS.

The Vercel API cannot use the Compose hostname `db`. The current PostgreSQL container is private to the VPS Docker network and its port is not published, so it is not reachable from Vercel as configured. Before using this Vercel deployment, provide a secure Vercel-to-database network route or use a managed PostgreSQL service, then set the API's database environment variables to that reachable endpoint. Vercel Services are currently in beta; see the [Services guide](https://vercel.com/docs/services).
