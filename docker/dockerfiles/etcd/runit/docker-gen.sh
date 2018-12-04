#!/usr/bin/env bash

LOGFILE='/var/log/docker-gen.log'

sleep 3

echo "Starting $(date)" >> $LOGFILE

exec $DOCKERGEN -watch -only-exposed -notify "bash /etcd-update.sh" /etcd-update.tmpl /etcd-update.sh >> $LOGFILE 2>&1
