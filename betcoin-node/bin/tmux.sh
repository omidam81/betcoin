#!/usr/bin/env bash

ROOT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )"/../../ && pwd )
REPO_DIR=$ROOT_DIR/betcoin-node
CRYPTO_DIR=$ROOT_DIR/crypto-wallet
VOLUME_DIR=$ROOT_DIR/volumes
DOCKR=$REPO_DIR/bin/dockr

cd $REPO_DIR

if ! docker info >/dev/null 2>&1
then
    echo "Docker is not running. Start docker first (verion 1.3.3 required)"
    exit 1
fi

SESSION=betcoin-node

if [[ "$1" == "-k" ]]
then
    tmux kill-session -t $SESSION
    exit
fi

echo -e "\e]0;$SESSION\a"

EXISTING=$(tmux list-sessions 2>/dev/null | grep -o $SESSION)

if [[ -n "$EXISTING" ]]
then
    tmux attach -t $SESSION
    exit
fi

echo -n "sudo password: "
read -s SUDO_PASSWD

MONGO_RUNNING="$(docker ps | grep -o mongod_)"

if [[ -z "$MONGO_RUNNING" ]]
then
    echo "starting mongo"
    echo $SUDO_PASSWD | sudo -S rm $VOLUME_DIR/mongo/*/db/mongod.lock
    make mongo
    sleep 15;
fi

COINS_RUNNING="$(docker ps | grep -E '(bit|lite|doge|pp|name)coind,' | wc -l)"

echo "$COINS_RUNNING coin containers running"

if [[ "$COINS_RUNNING" -lt "5" ]]
then
    echo "starting coins"
    make coins
fi

make proxy

tmux new-session -d -s $SESSION

tmux new-window -t $SESSION:2 -n 'shells'
tmux new-window -t $SESSION:3 -n 'mongo'
# tmux new-window -t $SESSION:4 -n 'crypto logs'

tmux split-window -v -t $SESSION:2.0 -v -p 20
tmux send-keys -t $SESSION:2.0 'cd '$REPO_DIR' && docker rm -f betcoin_node_testshell; sleep 3m && make testshell' C-m
tmux send-keys -t $SESSION:2.0 'grunt jshint && DEV_BYPASS_TOTP=t HUBSPOT_KEY= MANDRILL_KEY= node src/app -v' C-m
tmux send-keys -t $SESSION:2.1 'cd '$REPO_DIR' && docker rm -f service_node_testshell; make CONTAINER_NAME=service_node RUNENV=service testshell' C-m
tmux send-keys -t $SESSION:2.1 'grunt jshint && node src/service-app -v' C-m

tmux send-keys -t $SESSION:3.0 $DOCKR' shell mongod' C-m

# tmux split-window -v -t $SESSION:4.0 -p 80
# tmux split-window -v -t $SESSION:4.1 -p 75
# tmux split-window -v -t $SESSION:4.2 -p 66
# tmux split-window -v -t $SESSION:4.3 -p 50
# tmux split-window -h -t $SESSION:4.0 -p 50
# tmux split-window -h -t $SESSION:4.1 -p 50
# tmux split-window -h -t $SESSION:4.2 -p 50
# tmux split-window -h -t $SESSION:4.3 -p 50
# tmux split-window -h -t $SESSION:4.4 -p 50

# tmux send-keys -t $SESSION:4.0 'tailf -100 '$CRYPTO_DIR'/bitcoin-app-run.log' C-m
# tmux send-keys -t $SESSION:4.5 'sudo tailf -100 '$VOLUME_DIR'/bitcoin/testnet3/debug.log' C-m

# tmux send-keys -t $SESSION:4.1 'tailf -100 '$CRYPTO_DIR'/litecoin-app-run.log' C-m
# tmux send-keys -t $SESSION:4.6 'sudo tailf -100 '$VOLUME_DIR'/litecoin/debug.log' C-m

# tmux send-keys -t $SESSION:4.2 'tailf -100 '$CRYPTO_DIR'/dogecoin-app-run.log' C-m
# tmux send-keys -t $SESSION:4.7 'sudo tailf -100 '$VOLUME_DIR'/dogecoin/debug.log' C-m

# tmux send-keys -t $SESSION:4.3 'tailf -100 '$CRYPTO_DIR'/ppcoin-app-run.log' C-m
# tmux send-keys -t $SESSION:4.8 'sudo tailf -100 '$VOLUME_DIR'/ppcoin/debug.log' C-m

# tmux send-keys -t $SESSION:4.4 'tailf -100 '$CRYPTO_DIR'/namecoin-app-run.log' C-m
# tmux send-keys -t $SESSION:4.9 'sudo tailf -100 '$VOLUME_DIR'/namecoin/debug.log' C-m


sleep 3

for target in 3.0 # 4.5 4.6 4.7 4.8 4.9
do
    tmux send-keys -t $SESSION:$target $SUDO_PASSWD C-m
done

sleep 3

tmux send-keys -t $SESSION:3.0 'mongo -u admin -p admin admin' C-m

tmux select-window -t $SESSION:1

tmux attach -t $SESSION
