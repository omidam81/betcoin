#!/usr/bin/env bash

logfile=/var/log/bet-daemon.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /prize-node && exec /sbin/setuser app /usr/bin/node bet-daemon --minconf $MINCONF 2>&1 | tee -a $logfile | tee -a /var/log/prize-node.log > /dev/null
