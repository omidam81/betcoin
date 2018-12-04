#!/usr/bin/env bash

logfile=/var/log/bitcoin-wallet.log

if [[ -z "$(env | grep MONGO)" ]]
then
    echo "NO MONGO ENVIRONMENT VARIABLES" >> $logfile
    sleep 3
    exit 1
fi

BITCOIND_RUNNING=$(bitcoind --datadir=/home/bitcoind/.bitcoin getinfo)

if [[ -z "$BITCOIND_RUNNING" ]]
then
    echo "waiting for bitcoind" >> $logfile
    sleep 3
    exit 2
fi

exec /sbin/setuser bitcoind /usr/bin/node /bitcoin-wallet/notifier >> $logfile 2>&1
