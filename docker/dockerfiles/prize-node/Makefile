BRANCH=master
VERSION=latest

SUFFIX=mainnet
RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)

all: base bet game api

push: push-api push-bet-daemon push-game-daemon

push-base:
	docker push docker.betcoin.tm/prize-base:$(VERSION)

push-api:
	docker push docker.betcoin.tm/prize-api:$(VERSION)

push-bet-daemon:
	docker push docker.betcoin.tm/prize-bet-daemon:$(VERSION)

push-game-daemon:
	docker push docker.betcoin.tm/prize-game-daemon:$(VERSION)

base:
	cd prize-base && make BRANCH=$(BRANCH) VERSION=$(VERSION)

bet:
	cd prize-bet-daemon && docker build -t docker.betcoin.tm/prize-bet-daemon:$(VERSION) .

game:
	cd prize-game-daemon && docker build -t docker.betcoin.tm/prize-game-daemon:$(VERSION) .

api:
	cd prize-api && docker build -t docker.betcoin.tm/prize-api:$(VERSION) .

envfile:
	[ -f $(ENVFILE) ]

shell: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	-it docker.betcoin.tm/prize-base -- bash -l

gamegen: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	docker.betcoin.tm/prize-base -- node /prize-node/bin/generate-games --game $(GAME)

addressgen: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	docker.betcoin.tm/prize-base -- node /prize-node/bin/address-setup

run-api: envfile
	docker rm -f prize_api; docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	--name prize_api \
	-d docker.betcoin.tm/prize-api

run-bet-daemon: envfile
	docker rm -f prize_bet_daemon; docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	--name prize_bet_daemon \
	-d docker.betcoin.tm/prize-bet-daemon

run-game-daemon: envfile
	docker rm -f prize_game_daemon; docker run \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_prize_$(SUFFIX):bitcoind \
	--env-file $(ENVFILE) \
	--name prize_game_daemon \
	-d docker.betcoin.tm/prize-game-daemon

remove:
	docker rm -f prize_api prize_game_daemon prize_bet_daemon

runall: run-bet-daemon run-game-daemon run-api
