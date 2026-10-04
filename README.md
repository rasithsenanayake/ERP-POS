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

In a second terminal, run `npm run dev --prefix apps/web`. The Next.js dev server proxies `/api/*` to the NestJS API at `http://localhost:3001`.

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
