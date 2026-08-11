# TerminalExplore site

Production-ready React/Vite site with a small Express + SQLite blog API.

## Local development

```bash
npm install
npm run dev
```

Frontend API calls expect the backend under `/api`.

## Docker

Create `.env` from the example and replace `JWT_SECRET` with a long random value:

```bash
cp .env.example .env
docker compose up -d --build
```

The site is available at `http://localhost:8090` by default.

Public endpoints:

- `GET /api/health`
- `GET /api/rss.xml`
- `GET /api/sitemap.xml`
- `GET /robots.txt`

## Create the first admin

Run this after the containers are built:

```bash
docker compose run --rm -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=long-random-password api npm run seed
```

`ADMIN_PASSWORD` must be at least 12 characters. The script also seeds a couple of initial published posts if the blog is empty.

## Services

- `web`: nginx serving the built frontend and proxying `/api` to the backend.
- `api`: Express API with SQLite persisted in the `blog-data` Docker volume.

Set `SITE_URL` in `.env` to the real public domain before production deployment. It is used for RSS and sitemap links.

## Production

Use the production override when a real domain points to the server:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Set `SITE_DOMAIN=example.com` and `SITE_URL=https://example.com` in `.env`. Caddy will handle HTTPS automatically.

## Checks

```bash
npm run typecheck
npm run build
docker compose config
docker compose build
cd api && npm test
./scripts/smoke.ps1
```
