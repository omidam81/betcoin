NAME=docker.betcoin.tm/dice-handler-node
VERSION=latest
BRANCH=master
WALLET_BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/dice-handler-node.log

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

all: git wallet branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/dice-handler-node src/dice-handler-node

wallet:
	-git clone git@bitbucket.org:betcn/bitcoin-wallet src/bitcoin-wallet


branch:
	cd src; cd dice-handler-node && git fetch && git checkout origin/$(BRANCH) && cd ../bitcoin-wallet && \
	git fetch && git checkout origin/$(WALLET_BRANCH)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: remove envfile logfile
	docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_dice:bitcoind \
	-v $(LOGFILE):/var/log/dice-handler-node.log \
	--env-file $(ENVFILE) \
	--name dice_handler_node \
	-d $(NAME):$(VERSION)

shell: envfile logfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_dice:bitcoind \
	-v $(LOGFILE):/var/log/dice-handler-node.log \
	--env-file $(ENVFILE) \
	-it $(NAME):$(VERSION) -- bash -l

gamegen: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_dice:bitcoind \
	--env-file $(ENVFILE) \
	$(NAME):$(VERSION) -- node /dice-handler-node/bin/generate-dice-secrets

addressgen: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_dice:bitcoind \
	--env-file $(ENVFILE) \
	$(NAME):$(VERSION) -- node /dice-handler-node/bin/generate-addresses

recover: envfile logfile
	docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_dice:bitcoind \
	-v $(LOGFILE):/var/log/dice-handler-node.log \
	--entrypoint=node \
	--env-file $(ENVFILE) \
	--rm $(NAME):$(VERSION) /dice-handler-node/bin/broadcast-transaction $(TXID)

envfile:
	[ -f $(ENVFILE) ]

clean:
	rm -rf src/dice-handler-node/ src/bitcoin-wallet/

remove:
	-docker rm -f dice_handler_node

stop:
	docker stop dice_handler_node

start:
	docker start dice_handler_node

