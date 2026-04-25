# img-free

浏览器端图片格式转换与预览；pnpm monorepo（Next.js 前端 + NestJS API）。

**English:** [README.en.md](./README.en.md)

## 功能概览

- **Web**（`apps/web`）：上传/拖拽图片，选择输出格式，预览结果；支持多语言（默认 `zh-CN`）。
- **API**（`apps/api`）：转换与相关处理（含 DST `.tex` 等能力所需的本地工具链，见 `apps/api/bin`）。

## 环境要求

- Node.js（建议 LTS）
- [pnpm](https://pnpm.io/)（仓库锁定 `packageManager` 字段中的版本）

## 快速开始

```bash
pnpm install
pnpm dev
```

- 前端：<http://localhost:3000>
- API：<http://localhost:3002>（可通过环境变量 `PORT` 覆盖）

### Docker（推荐）

本机或 Linux 上一键起服务（需已安装 [Docker](https://docs.docker.com/get-docker/) 与 [Compose](https://docs.docker.com/compose/)）：

```bash
docker compose up --build
```

浏览器访问 <http://localhost:3000>；API 映射在 <http://localhost:3002>。  
若部署到公网，构建前端前设置浏览器可访问的 API 根地址，例如：

```bash
export NEXT_PUBLIC_API_BASE="https://api.example.com"
docker compose up --build
```

### 公网部署（Nginx + HTTPS + 无端口冲突）

无需在服务器上手动安装 Nginx：直接使用 Docker 拉取并运行 Nginx 容器，对外只暴露 **80/443**，内部把 `/` 代理到 web，把 `/api` 代理到 api。

1) 准备域名 `DOMAIN`（DNS 指向服务器公网 IP），并开放 80/443。

2) 首次申请证书（替换邮箱与域名）：

```bash
export DOMAIN="example.com"
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email you@example.com --agree-tos --no-eff-email
```

3) 启动生产栈：

```bash
export DOMAIN="example.com"
docker compose -f docker-compose.prod.yml up -d --build
```

4) 续期（建议加到 crontab）：

```bash
./scripts/renew-cert-and-reload-nginx.sh
```

例如（每天凌晨 3 点跑一次）：

```bash
0 3 * * * cd /path/to/img-free && DOMAIN="img-free.chrisley.site" ./scripts/renew-cert-and-reload-nginx.sh >> /var/log/img-free-renew.log 2>&1
```

### 公网部署（Caddy：零手动证书）

如果你希望**除了启动命令外不再手动申请/续期证书**，推荐使用 Caddy：它会在首次启动时自动签发 HTTPS 证书，并自动续期。

前提：

- DNS：`img-free.chrisley.site` 的 A 记录指向服务器公网 IP
- 端口：放行 80/443（Caddy 需要用于 ACME 验证与签发）

启动：

```bash
export DOMAIN="img-free.chrisley.site"
docker compose -f docker-compose.caddy.prod.yml up -d --build
```

之后直接访问：`https://img-free.chrisley.site`

## 常用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动 web 与 api 开发服务 |
| `pnpm build` | 构建全部 workspace 包 |
| `pnpm lint` | 全仓库 lint |
| `pnpm typecheck` | 全仓库 TypeScript 检查 |

## 目录结构（简要）

```
apps/web   # Next.js 应用
apps/api   # NestJS 服务
```

## 许可证

以各子包及依赖的许可证为准；使用前请阅读 `apps/api` 下第三方二进制与文档说明。
