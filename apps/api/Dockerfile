# 多阶段构建：Nest API（含 bin 下的 stex 等 Linux 资源）
FROM node:22-bookworm AS builder
WORKDIR /repo
ENV CI=1

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api

# Generate Prisma client (Prisma v5 writes to node_modules/@prisma/client)
RUN cd apps/api && DATABASE_URL="file:./prisma/dev.db" node ../../node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js generate --schema=prisma/schema.prisma
RUN pnpm --filter api build

FROM node:22-bookworm-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter api --prod

COPY models models
COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/apps/api/bin apps/api/bin
COPY --from=builder /repo/apps/api/prisma apps/api/prisma

WORKDIR /repo/apps/api
EXPOSE 3002
ENV PORT=3002
ENV STEXATLASER_BIN=/repo/apps/api/bin/stexatlaser-linux/stex
# Run Prisma migrations then start the server
CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma && node dist/main.js"]
