#!/usr/bin/env bash

logfile=/var/log/dice-handler-node.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /dice-handler-node && exec /sbin/setuser app /usr/bin/node dice-handler >> $logfile 2>&1
