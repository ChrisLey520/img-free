#!/usr/bin/env sh
set -eu

# 说明：
# - 续期证书（如无到期证书则不变更）
# - 若续期命令执行成功，则优雅 reload Nginx（通常不中断现有连接）

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec -T nginx nginx -t
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload

echo "Done: certbot renew + nginx reload"

