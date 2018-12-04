#!/usr/bin/env bash


while ! grep "waiting for connections on port 2701[7-9]" /data/primary/mongod.log >/dev/null 2>&1
do
    echo -n ".";
    sleep 3;
done
echo ""
echo "Letting mongo start up"

sleep 15s

RSCONF='{ _id:"rs0", members: [ { _id: 0, host: "mongod:27017" }, { _id: 1, host: "mongod:27018" }, { _id: 2, host: "mongod:27019", arbiterOnly: true } ] }'

USERADD="addUser('admin', 'admin')";
GETDB="db.getSiblingDB";
echo "rs.slaveOk(); rs.initiate($RSCONF);" | mongo admin
echo "Waiting for replica set to initiate"
sleep 2m
echo "Adding admin user"
echo "db.$USERADD" | mongo admin
echo "Adding user to userdb"
echo "$GETDB('userdb').$USERADD" | mongo -u admin -p admin admin
echo "Adding user to userdb_test"
echo "$GETDB('userdb_test').$USERADD" | mongo -u admin -p admin admin
echo "Adding user to gamedb"
echo "$GETDB('gamedb').$USERADD" | mongo -u admin -p admin admin
echo "Adding user to gamedb_test"
echo "$GETDB('gamedb_test').$USERADD" | mongo -u admin -p admin admin
echo "Adding user to logs"
echo "$GETDB('logs').$USERADD" | mongo -u admin -p admin admin
