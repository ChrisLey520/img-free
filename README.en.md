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
