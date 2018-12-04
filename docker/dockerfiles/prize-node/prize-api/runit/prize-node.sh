#!/usr/bin/env bash

logfile=/var/log/prize-node.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /prize-node && exec /sbin/setuser app /usr/bin/node prize-api >> $logfile 2>&1
