#!/usr/bin/env bash

REPO_DIR=$PWD
VOLUME_DIR=/media/blockchains
WALLET_DIR=$PWD/../crypto-wallet

if [[ -f $REPO_DIR/.bootstrap ]]
then
    echo "Already bootstrapped";
    exit 0;
fi

FAIL() {
    echo $1 && exit ${2:-1}
}

echo "mongo primary hostname"
read MONGO_PRIMARY

echo "mongo secondary hostname"
read MONGO_SECONDARY

echo "replica set name"
read MONGO_REPL

echo "mongo user"
read MONGO_USER

echo "mongo password"
read -s MONGO_PASSWORD

echo "MONGO_PORT_27017_TCP=tcp://$MONGO_PRIMARY:27017" > $REPO_DIR/env/mongo-primary
echo "MONGO_PORT_27017_TCP=tcp://$MONGO_SECONDARY:27017" > $REPO_DIR/env/mongo-secondary

make mongo-live


# clone tyhe crypto wallet repo, makes starting this up easier
git clone git@bitbucket.org:betcn/crypto-wallet $WALLET_DIR 2>/dev/null
cd $WALLET_DIR && git pull
echo "MONGO_USER=$MONGO_USER" > $WALLET_DIR/env/default
echo "MONGO_PASSWORD=$MONGO_PASSWORD" >> $WALLET_DIR/env/default
echo "MONGO_REPLICA_SET=$MONGO_REPL" >> $WALLET_DIR/env/default

rm $REPO_DIR/env/default 2>/dev/null
echo "MONGO_USER=$MONGO_USER" >> $REPO_DIR/env/default
echo "MONGO_PASSWORD=$MONGO_PASSWORD" >> $REPO_DIR/env/default
echo "MONGO_REPLICA_SET=$MONGO_REPL" >> $REPO_DIR/env/default
# get cryptod instances and run them
for COIN in bitcoin litecoin dogecoin ppcoin namecoin
do
    COIN_DIR=$VOLUME_DIR/$COIN
    COIN_CONF=$COIN_DIR/$COIN.conf
    if [ -d "$COIN_DIR" ]
    then
        echo "$COIN_DIR exists, chowning to set config"
        sudo chown -R $USER:$USER $COIN_DIR
    else
        mkdir -p $COIN_DIR
    fi
    [[ -f $COIN_CONF ]] && rm $COIN_CONF
    if  [[ "$COIN" = "dogecoin" ]]
    then
        echo "rpcallowip=172.17.0.0/16" >> $COIN_CONF
    else
        echo "rpcallowip=172.17.*" >> $COIN_CONF
    fi
    RPCPASS="${RANDOM}${RANDOM}${RANDOM}${COIN}rpc${RANDOM}${RANDOM}${RANDOM}"
    RPCUSER="${RANDOM}${COIN}"
    echo "rpcuser=$RPCUSER" >> $COIN_CONF
    echo "rpcpassword=$RPCPASS" >> $COIN_CONF
    echo "walletnotify=/app/src/bin/received %s" >> $COIN_CONF
    echo "blocknotify=/app/src/bin/blocknotify %s" >> $COIN_CONF
    echo "txindex=1" >> $COIN_CONF

    echo "$(echo $COIN | tr 'a-z' 'A-Z')_RPCUSER=$RPCUSER" >> $REPO_DIR/env/default
    echo "$(echo $COIN | tr 'a-z' 'A-Z')_RPCPASSWORD=$RPCPASS" >> $REPO_DIR/env/default
    make DATA=$COIN_DIR COIN=$COIN run
done

cd $REPO_DIR

echo "VIRTUAL_HOST=www.betcoin.tm" >> $REPO_DIR/env/default
echo "PROXY_PORT=443" >> $REPO_DIR/env/default
echo "API_MOUNT=" >> $REPO_DIR/env/default
echo "UPSTREAM=betcoin-node" >> $REPO_DIR/env/default



touch .bootstrap

FAIL "The blockchains are syncing, please wait for at least the bitcoin testnet to finish syncing before tyring to run the test suite"
