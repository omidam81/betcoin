NAME=docker.betcoin.tm/bitcoind
VERSION=latest
BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
SUFFIX=mainnet

PORT=8333
RPCPORT=8332

DATADIR=$(PWD)/../../volumes/bitcoin-$(SUFFIX)
LOGFILE=$(PWD)/../../logs/bitcoin-wallet.log

all: git branch
	docker build -t $(NAME):$(VERSION) .

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest

git:
	-git clone git@bitbucket.org:betcn/bitcoin-wallet src/bitcoin-wallet

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

branch:
	cd src/bitcoin-wallet && git fetch && git checkout origin/$(BRANCH) && cd ../

volume:
	[ -d $(DATADIR) ]

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

run-live: volume envfile logfile
	docker rm -f bitcoind_$(SUFFIX); \
	docker run \
		-v $(DATADIR):/home/bitcoind/.bitcoin \
		--env-file $(ENVFILE) \
		--link mongo_amb_primary:mongo \
		--name bitcoind_$(SUFFIX) \
		-p $(PORT):$(PORT) \
		-v $(LOGFILE):/var/log/bitcoin-wallet.log \
		-c 1 \
		-d $(NAME):$(VERSION) && \
	docker rm -f bitcoind_amb_$(SUFFIX); \
	docker run \
		--link bitcoind_$(SUFFIX):bitcoind \
		--expose 1337 --expose $(RPCPORT) \
		--name bitcoind_amb_$(SUFFIX) \
		-d svendowideit/ambassador

run-mainnet: volume envfile logfile
	docker rm -f bitcoind_$(SUFFIX); \
	docker run \
		-v $(DATADIR):/home/bitcoind/.bitcoin \
		--env-file $(ENVFILE) \
		--link mongo_amb_primary:mongo \
		--name bitcoind_$(SUFFIX) \
		-p $(PORT):$(PORT) \
		-v $(LOGFILE):/var/log/bitcoin-wallet.log \
		-c 1 \
		-d $(NAME):$(VERSION) && \
	docker rm -f bitcoind_amb_$(SUFFIX); \
	docker run \
		--link bitcoind_$(SUFFIX):bitcoind \
		--expose 1337 --expose $(RPCPORT) \
		--name bitcoind_amb_$(SUFFIX) \
		-d svendowideit/ambassador

run-testnet: volume logfile envfile
	docker rm -f bitcoind_$(SUFFIX); \
	docker run \
		-v $(DATADIR):/home/bitcoind/.bitcoin \
		--env-file $(ENVFILE) \
		--link mongo_amb_primary:mongo \
		--name bitcoind_$(SUFFIX) \
		-p 1$(PORT):1$(PORT) \
		-v $(LOGFILE):/var/log/bitcoin-wallet.log \
		-c 1 \
		--expose 1$(RPCPORT) \
		-d $(NAME):$(VERSION) && \
	docker rm -f bitcoind_amb_$(SUFFIX); \
	docker run \
		--link bitcoind_$(SUFFIX):bitcoind \
		--expose 1337 --expose 1$(RPCPORT) \
		--name bitcoind_amb_$(SUFFIX) \
		-d svendowideit/ambassador

shell:
	docker run --rm\
		--entrypoint bash \
		-it $(NAME):$(VERSION) -l

envfile:
	[ -f $(ENVFILE) ]

clean:
	rm -rf src/bitcoin-wallet/

remove:
	docker rm -f bitcoind_$(SUFFIX) bitcoind_amb_$(SUFFIX)

stop:
	docker stop bitcoind_amb_$(SUFFIX) bitcoind_$(SUFFIX)

start:
	docker start bitcoin_$(SUFFIX) bitcoind_amb_$(SUFFIX)

