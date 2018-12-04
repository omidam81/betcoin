#!/usr/bin/env bash

chown -R bitcoind:bitcoind /home/bitcoind/.bitcoin
chmod 600 /home/bitcoind/.bitcoin/bitcoin.conf

exec /sbin/setuser bitcoind /usr/bin/bitcoind -datadir=/home/bitcoind/.bitcoin >> /var/log/bitcoind.log 2>&1
