NAME=docker.betcoin.tm/player-node
VERSION=latest
BRANCH=master
WALLET_BRANCH=master
AUTH_BRANCH=master
LOGGER_BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/player-node.log

all: git wallet auth logger branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/player-node src/player-node

wallet:
	-git clone git@bitbucket.org:betcn/bitcoin-wallet src/bitcoin-wallet

auth:
	-git clone git@bitbucket.org:betcn/auth-npm src/auth-npm

logger:
	-git clone git@bitbucket.org:betcn/logger-npm src/logger-npm

branch:
	cd src; cd player-node && git fetch && git checkout origin/$(BRANCH) && cd ../bitcoin-wallet && \
	git fetch && git checkout origin/$(WALLET_BRANCH) && cd ../auth-npm && \
	git fetch && git checkout origin/$(AUTH_BRANCH) && cd ../logger-npm \
	git fetch && git checkout origin/$(LOGGER_BRANCH)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: envfile logfile
	docker rm -f player_node; docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--name player_node \
	-v $(LOGFILE):/var/log/player-node.log \
	-d $(NAME):$(VERSION)

run-live: envfile logfile
	docker rm -f player_node; docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--name player_node \
	-v $(LOGFILE):/var/log/player-node.log \
	-d $(NAME):$(VERSION)

payout: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /player-node/bin/pay-pending

appkey:
	docker run --rm \
		--link mongo_amb_primary:mongo \
		--env-file $(ENVFILE) \
		$(NAME):$(VERSION) -- node /player-node/bin/app-keygen --app $(APP)

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

envfile:
	[ -f $(ENVFILE) ]

clean:
	rm -rf src/player-node/ src/bitcoin-wallet/ src/auth-npm/

remove:
	docker rm -f player_node

stop:
	docker stop player_node

start:
	docker start player_node

