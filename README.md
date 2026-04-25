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
