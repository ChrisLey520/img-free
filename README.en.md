# img-free

Image format conversion and preview in the browser. pnpm monorepo: Next.js web app + NestJS API.

**中文（默认）：** [README.md](./README.md)

## Overview

- **Web** (`apps/web`): upload or drag-and-drop images, pick output format, preview results; i18n (default locale `zh-CN`).
- **API** (`apps/api`): conversion pipeline (includes local tooling under `apps/api/bin` where needed, e.g. DST `.tex`).

## Prerequisites

- Node.js (LTS recommended)
- [pnpm](https://pnpm.io/) (version pinned via root `packageManager`)

## Quick start

```bash
pnpm install
pnpm dev
```

- Web: <http://localhost:3000>
- API: <http://localhost:3002> (override with `PORT`)

### Docker (recommended)

One command (requires [Docker](https://docs.docker.com/get-docker/) and [Compose](https://docs.docker.com/compose/)):

```bash
docker compose up --build
```

Open <http://localhost:3000>; API is on <http://localhost:3002>.  
For a public deployment, set the API URL the **browser** will call before building the web image:

```bash
export NEXT_PUBLIC_API_BASE="https://api.example.com"
docker compose up --build
```

### Public deployment (Nginx + HTTPS, no port conflicts)

You **do not** need to install Nginx on the server. This repo provides a production compose file that runs an Nginx container exposing only **80/443**, proxying `/` → web and `/api` → api.

1) Prepare your domain `DOMAIN` (DNS → server public IP) and open ports 80/443.

2) Get the initial certificate (replace email and domain):

```bash
export DOMAIN="example.com"
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email you@example.com --agree-tos --no-eff-email
```

3) Start the production stack:

```bash
export DOMAIN="example.com"
docker compose -f docker-compose.prod.yml up -d --build
```

4) Renew (put on cron if desired):

```bash
./scripts/renew-cert-and-reload-nginx.sh
```

Example (run daily at 03:00):

```bash
0 3 * * * cd /path/to/img-free && DOMAIN="img-free.chrisley.site" ./scripts/renew-cert-and-reload-nginx.sh >> /var/log/img-free-renew.log 2>&1
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run web + api in parallel (dev) |
| `pnpm build` | Build all workspace packages |
| `pnpm lint` | Lint entire repo |
| `pnpm typecheck` | Typecheck entire repo |

## Layout

```
apps/web   # Next.js app
apps/api   # NestJS service
```

## License

Follow licenses of subpackages and dependencies; read third-party binaries and notes under `apps/api` before use.
