# 多阶段构建：Nest API（含 bin 下的 stex 等 Linux 资源）
FROM node:22-bookworm AS builder
WORKDIR /repo
ENV CI=1

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api

RUN pnpm --filter api build

FROM node:22-bookworm-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter api --prod

COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/apps/api/bin apps/api/bin

WORKDIR /repo/apps/api
EXPOSE 3002
ENV PORT=3002
ENV STEXATLASER_BIN=/repo/apps/api/bin/stexatlaser-linux/stex
CMD ["node", "dist/main.js"]
