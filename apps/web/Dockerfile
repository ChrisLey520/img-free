# 多阶段构建：Next.js Web（构建时注入 NEXT_PUBLIC_API_BASE）
FROM node:22-bookworm AS builder
WORKDIR /repo
ENV CI=1

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

ARG NEXT_PUBLIC_API_BASE=http://localhost:3002
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

RUN pnpm --filter web build

FROM node:22-bookworm-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter web --prod

COPY --from=builder /repo/apps/web/.next apps/web/.next
COPY --from=builder /repo/apps/web/public apps/web/public
COPY apps/web/next.config.ts apps/web/

WORKDIR /repo/apps/web
EXPOSE 3000
ENV PORT=3000
CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
