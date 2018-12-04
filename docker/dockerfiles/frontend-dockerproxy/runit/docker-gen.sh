#!/usr/bin/env bash

LOGFILE='/var/log/docker-gen.log'

sleep 3

echo "Starting $(date)" >> $LOGFILE

exec $DOCKERGEN -watch -only-exposed -notify "nginx -s reload" /nginx.tmpl /etc/nginx/sites-enabled/api >> $LOGFILE 2>&1
