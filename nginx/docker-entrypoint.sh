#!/bin/sh
set -e

# Substitute DOMAIN in nginx config, then start nginx
envsubst '${DOMAIN}' < /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
