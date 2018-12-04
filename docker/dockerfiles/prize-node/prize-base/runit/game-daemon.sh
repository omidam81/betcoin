#!/usr/bin/env bash

logfile=/var/log/game-daemon.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

cd /prize-node && exec /sbin/setuser app /usr/bin/node game-daemon --consolidations $CONSOLIDATIONS --minconsolidate $MINCONSOLODATE 2>&1 | tee -a $logfile | tee -a /var/log/prize-node.log > /dev/null
