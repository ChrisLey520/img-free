FROM nginx:1.27-alpine

# envsubst for DOMAIN variable substitution
RUN apk add --no-cache gettext

COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
