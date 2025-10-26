#!/bin/sh
set -e
cp /home/site/wwwroot/nginx/nginx.conf /etc/nginx/sites-enabled/default
nginx -t
nginx -s reload || nginx
