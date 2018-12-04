#!/usr/bin/env bash

REPO_DIR=$PWD
VOLUME_DIR=$PWD/../volumes
WALLET_DIR=$PWD/../crypto-wallet

if [[ -f $REPO_DIR/.bootstrap ]]
then
    echo "Already bootstrapped";
    exit 0;
fi

FAIL() {
    echo $1 && exit ${2:-1}
}

if [[ -d $VOLUME_DIR ]]
then
    exit "You already have a folder at ../volumes, please move it out of the damn way" 1;
fi

# get the mongo docker image and bootstrap them
docker pull docker.betcoin.tm/mongod-replicaset || FAIL "Failed pulling mongo image";

# set up confs and volumes for mongo
MONGO_PORT=27017
for RSTYPE in primary secondary arbitor
do
    RS_DIR=$VOLUME_DIR/mongo/$RSTYPE
    RS_CONF=$RS_DIR/mongod.conf
    mkdir -p $RS_DIR
    echo "dbpath=/data/$RSTYPE/db" > $RS_CONF
    echo "logpath=/data/$RSTYPE/mongod.log" >> $RS_CONF
    echo "logappend=true" >> $RS_CONF
    echo "auth=true" >> $RS_CONF
    echo "port=$MONGO_PORT" >> $RS_CONF
    MONGO_PORT=$[$MONGO_PORT+1]
    echo "replSet=rs0" >> $RS_CONF
    if [[ "$RSTYPE" = "arbitor" ]]
    then
        echo "nojournal=true" >> $RS_CONF
        echo "smallfiles=true" >> $RS_CONF
        echo "noprealloc=true" >> $RS_CONF
    fi
    echo "keyFile=/data/rs0.key" >> $RS_CONF
done
echo $RANDOM$RANDOM$RANDOM > $VOLUME_DIR/mongo/rs0.key
chmod 600 $VOLUME_DIR/mongo/rs0.key


echo "Bootstrapping mongo, please wait while the prealloc files are generated (takes about 4 minutes)"

docker run --rm \
    -h mongod \
    -v $VOLUME_DIR/mongo:/data \
    -v $REPO_DIR/bin/mongo-setup.sh:/mongo-setup.sh \
    -it docker.betcoin.tm/mongod-replicaset -- bash /mongo-setup.sh

cd $REPO_DIR
make mongo
# clone tyhe crypto wallet repo, makes starting this up easier
git clone git@bitbucket.org:betcn/crypto-wallet $WALLET_DIR
cd $WALLET_DIR
echo "MONGO_USER=admin" > $WALLET_DIR/env/default
echo "MONGO_PASSWORD=admin" >> $WALLET_DIR/env/default

# get cryptod instances and run them
for COIN in bitcoin litecoin dogecoin ppcoin namecoin
do
    docker pull docker.betcoin.tm/$COIN || FAIL "Failed pulling $COIN container";
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
    [[ "$COIN" = "bitcoin" ]] && echo "testnet=1" > $COIN_CONF
    if  [[ "$COIN" = "dogecoin" ]]
    then
        echo "rpcallowip=172.17.0.0/16" >> $COIN_CONF
    else
        echo "rpcallowip=172.17.*" >> $COIN_CONF
    fi
    echo "rpcuser=$COIN" >> $COIN_CONF
    echo "rpcpassword=${COIN}rpc" >> $COIN_CONF
    echo "walletnotify=/app/src/bin/received %s" >> $COIN_CONF
    echo "blocknotify=/app/src/bin/blocknotify %s" >> $COIN_CONF
    echo "txindex=1" >> $COIN_CONF
    if [[ "$COIN" = "bitcoin" ]]
    then
        make COIN=$COIN TESTNET=true run
    else
        make COIN=$COIN run
    fi
done

cd $REPO_DIR

rm $REPO_DIR/env/default 2>/dev/null
echo "MONGO_USER=admin" >> $REPO_DIR/env/default
echo "MONGO_PASSWORD=admin" >> $REPO_DIR/env/default
echo "BITCOIN_RPCUSER=bitcoin" >> $REPO_DIR/env/default
echo "BITCOIN_RPCPASSWORD=bitcoinrpc" >> $REPO_DIR/env/default
echo "BITCOIN_TESTNET=true" >> $REPO_DIR/env/default
echo "LITECOIN_RPCUSER=litecoin" >> $REPO_DIR/env/default
echo "LITECOIN_RPCPASSWORD=litecoinrpc" >> $REPO_DIR/env/default
echo "DOGECOIN_RPCUSER=dogecoin" >> $REPO_DIR/env/default
echo "DOGECOIN_RPCPASSWORD=dogecoinrpc" >> $REPO_DIR/env/default
echo "PPCOIN_RPCUSER=ppcoin" >> $REPO_DIR/env/default
echo "PPCOIN_RPCPASSWORD=ppcoinrpc" >> $REPO_DIR/env/default
echo "NAMECOIN_RPCUSER=namecoin" >> $REPO_DIR/env/default
echo "NAMECOIN_RPCPASSWORD=namecoinrpc" >> $REPO_DIR/env/default
echo "LOG_LEVEL=verbose" >> $REPO_DIR/env/default
echo "NODE_FILE=app" >> $REPO_DIR/env/default

echo "VIRTUAL_HOST=local.betcoin.tm" >> $REPO_DIR/env/default
echo "PROXY_PORT=443" >> $REPO_DIR/env/default
echo "API_MOUNT=" >> $REPO_DIR/env/default
echo "UPSTREAM=betcoin-node" >> $REPO_DIR/env/default

echo "MONGO_USER=admin" >> $REPO_DIR/env/service
echo "MONGO_PASSWORD=admin" >> $REPO_DIR/env/service
echo "BITCOIN_RPCUSER=bitcoin" >> $REPO_DIR/env/service
echo "BITCOIN_RPCPASSWORD=bitcoinrpc" >> $REPO_DIR/env/service
echo "BITCOIN_TESTNET=true" >> $REPO_DIR/env/service
echo "LITECOIN_RPCUSER=litecoin" >> $REPO_DIR/env/service
echo "LITECOIN_RPCPASSWORD=litecoinrpc" >> $REPO_DIR/env/service
echo "DOGECOIN_RPCUSER=dogecoin" >> $REPO_DIR/env/service
echo "DOGECOIN_RPCPASSWORD=dogecoinrpc" >> $REPO_DIR/env/service
echo "PPCOIN_RPCUSER=ppcoin" >> $REPO_DIR/env/service
echo "PPCOIN_RPCPASSWORD=ppcoinrpc" >> $REPO_DIR/env/service
echo "NAMECOIN_RPCUSER=namecoin" >> $REPO_DIR/env/service
echo "NAMECOIN_RPCPASSWORD=namecoinrpc" >> $REPO_DIR/env/service
echo "LOG_LEVEL=verbose" >> $REPO_DIR/env/service
echo "NODE_FILE=service-app" >> $REPO_DIR/env/service



touch .bootstrap

FAIL "The blockchains are syncing, please wait for at least the bitcoin testnet to finish syncing before tyring to run the test suite"
