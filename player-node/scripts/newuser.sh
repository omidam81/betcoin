#!/usr/bin/env bash

if [[ -z "$ALIAS" ]]
then
    echo -n "Alias: ";
    read ALIAS
    echo -n "Password (1234567890): ";
    read PASSWORD
fi

if [[ -z "$PASSWORD" ]]
then
    PASSWORD=1234567890
fi

BASEURL="https://local.betcoin.tm:441"
CONTENT_TYPE="Content-Type: application/json"

echo "Creating User"
curl -s "$BASEURL/user" \
    -X POST -H "$CONTENT_TYPE" \
    --data '{"alias":"'$ALIAS'", "password":"'$PASSWORD'", "password_confirm":"'$PASSWORD'", "email":"foo@bar.com"}' 2>&1 >/dev/null
echo "Registered"

USERDATA="$(curl -s "$BASEURL/auth" -u "$ALIAS:$PASSWORD")"
echo "Authenticated"

USERID="$(echo "$USERDATA" | jshon -e _id -u)"
TOKEN="$(echo "$USERDATA" | jshon -e token -u)"
AUTH_HEADER="Authorization: Bearer $TOKEN"
DEPOSIT_ADDRESS="$(echo "$USERDATA" | jshon -e deposit -e btc -e address -u)"
BONUS_ID="$(echo "$USERDATA" | jshon -e bonusOffers -e btc -k | head -1)"

echo "Adding withdraw address"
CHALLENGE="$(curl -s "$BASEURL/user/$USERID/challenge" -H "$AUTH_HEADER" | jshon -e challenge -u)"
echo "Got challenge string $CHALLENGE"
ADDRESS="$(bitcoind getnewaddress player)"
echo "Got withdraw address $ADDRESS"
SIG="$(bitcoind signmessage $ADDRESS $CHALLENGE)"

curl -s "$BASEURL/user/$USERID/address/withdraw/btc" \
    -X PUT -H "$CONTENT_TYPE" -H "$AUTH_HEADER" \
    --data '{"address":"'$ADDRESS'", "sig":"'$SIG'"}' 2>&1 >/dev/null

echo "alias           : $ALIAS"
echo "_id             : $USERID"
echo "token           : $TOKEN"
echo "deposit address : $DEPOSIT_ADDRESS"

echo "Accepting welcome bonus"
curl -s "$BASEURL/user/$USERID/bonus/accept/btc/$BONUS_ID" -H "$AUTH_HEADER" 2>&1 >/dev/null
echo "Sending BTC"
bitcoind sendtoaddress $DEPOSIT_ADDRESS 0.01

