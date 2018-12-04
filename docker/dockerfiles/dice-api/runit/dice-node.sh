#!/usr/bin/env bash

logfile=/var/log/dice-node.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /dice-node && exec /sbin/setuser app /usr/bin/node dice-server >> $logfile 2>&1
