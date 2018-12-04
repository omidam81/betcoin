#!/usr/bin/env bash

BASEURL="https://local.betcoin.tm:441"
CONTENT_TYPE="Content-Type: application/json"
ADDRESS="$(bitcoind getnewaddress player)"
echo "Got withdraw address $ADDRESS"

if [[ -x "$AFFILIATE" ]]
then
    echo -n "Affiliate Token: "
    read AFFILIATE
fi


echo "Creating User"
USERDATA="$(curl -s "$BASEURL/user" \
    -X POST -H "$CONTENT_TYPE" \
    --data '{"withdrawAddress":"'$ADDRESS'", "affiliateToken":"'$AFFILIATE'", "anonymous":true}')"
echo "Registered"

echo "$USERDATA"
echo "Authenticated"

USERID="$(echo "$USERDATA" | jshon -e _id -u)"
TOKEN="$(echo "$USERDATA" | jshon -e token -u)"
ALIAS="$(echo "$USERDATA" | jshon -e alias -u)"
AUTH_HEADER="Authorization: Bearer $TOKEN"
DEPOSIT_ADDRESS="$(echo "$USERDATA" | jshon -e deposit -e btc -e address -u)"
BONUS_ID="$(echo "$USERDATA" | jshon -e bonusOffers -e btc -k | head -1)"

echo "alias           : $ALIAS"
echo "_id             : $USERID"
echo "token           : $TOKEN"
echo "address         : $ADDRESS"
echo "deposit address : $DEPOSIT_ADDRESS"

echo "Sending BTC"
bitcoind sendtoaddress $DEPOSIT_ADDRESS 0.01

