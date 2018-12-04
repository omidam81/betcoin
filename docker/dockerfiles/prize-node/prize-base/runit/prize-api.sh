#!/usr/bin/env bash

logfile=/var/log/prize-api.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /prize-node && exec /sbin/setuser app /usr/bin/node prize-api 2>&1 | tee -a $logfile | tee -a /var/log/prize-node.log > /dev/null
