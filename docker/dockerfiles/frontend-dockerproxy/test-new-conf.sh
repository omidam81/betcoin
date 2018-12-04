#!/usr/bin/env bash

NEWCONF=/api-conf
OLDCONF=/etc/nginx/sites-enabled/api
LOGFILE=/var/log/docker-gen.log
SLEEP=10
echo "Got restart signal, sleeping $SLEEP" >> $LOGFILE
sleep $SLEEP
if [[ -f "$OLDCONF" ]]
then
    CONF_DIFF="$(diff "$NEWCONF" "$OLDCONF")"
    echo "conf diff: $CONF_DIFF" >> $LOGFILE
    if [[ -n "$CONF_DIFF" ]]
    then
        mv "$OLDCONF" "$NEWCONF"
        echo "restarting nginx" >> $LOGFILE
        sv restart nginx
    else
        echo "not restarting" >> $LOGFILE
    fi
else
    echo "No old conf at $OLDCONF, restarting nginx" >> $LOGFILE
    mv "$OLDCONF" "$NEWCONF"
    echo "restarting nginx" >> $LOGFILE
    sv restart nginx
fi
