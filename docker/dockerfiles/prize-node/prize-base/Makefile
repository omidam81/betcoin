NAME=docker.betcoin.tm/prize-base
VERSION=latest
BRANCH=master
WALLET_BRANCH=master

SUBSERVER=api
SUFFIX=mainnet
RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)


all: git wallet branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/prize-node src/prize-node

wallet:
	-git clone git@git.betcoin.tm:bitcoin/bitcoin-wallet src/bitcoin-wallet

branch:
	cd src; cd prize-node && git fetch && git checkout origin/$(BRANCH) && cd ../bitcoin-wallet && \
	git fetch && git checkout origin/$(WALLET_BRANCH) && cd ../

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

shell:
	docker rm -f prize-node; docker run --rm \
	--link mongo_ambassador:mongo \
	--link bitcoind_amb_prize:bitcoind \
	--env-file $(PWD)/env/dev \
	--name prize-node \
	-it docker.betcoin.tm/prize-$(SUBSERVER) -- bash -l

clean:
	rm -rf src/prize-node/ src/bitcoin-wallet/
