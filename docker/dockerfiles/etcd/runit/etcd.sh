#!/usr/bin/env bash

LOGFILE='/var/log/etcd.log'

echo "Starting $(date)" >> $LOGFILE

exec $ETCD >> $LOGFILE 2>&1
