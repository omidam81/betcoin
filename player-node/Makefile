NAME=docker.betcoin.tm/player-node
BUILDFLAGS=
VERSION=latest

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/run.log
BIN_FILE=

COLD_STORAGE_ADDRESS=1Dhd2V19w7zLaXrK1zPp2eES6Km1cBVzDs
COLD_STORAGE_AMOUNT=
CONTAINER_NAME=player_node
BITCOIND_CONTAINER=bitcoind_amb_player
MONGO_CONTAINER=mongo_amb_primary

all: test
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION) && [ "$(VERSION)" = "latest" ] || docker pull $(NAME):latest;

run: envfile logfile remove
	docker run \
	--link $(MONGO_CONTAINER):mongo \
	--link $(BITCOIND_CONTAINER):bitcoind \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-d $(NAME):$(VERSION)

shell: envfile logfile remove
	docker run \
	--link $(MONGO_CONTAINER):mongo \
	--link $(BITCOIND_CONTAINER):bitcoind \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-it $(NAME):$(VERSION) -- bash -l

bin:
	[ -n $(BIN_FILE) ] || exit 1
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/$(BIN_FILE)

unlockwallet: envfile
	docker run --rm \
		--entrypoint bash \
		--env-file $(ENVFILE) \
		-it $(NAME):$(VERSION) -c 'echo -n "password: " && read password && curl "http://bitcoind_amb_player:8332" --user "$RPCUSER:$RPCPASSWORD" --data-binary \'{"jsonrpc":"1.0", "id":"letmein", "method":"walletpassphrase", "params":["\'$password\'", 36000000]}\' -H "content-type: text/plain;"'


cashback: envfile
	docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/give-cashback

payout: envfile
	@docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/pay-pending

coldstorage: envfile
ifndef COLD_STORAGE_AMOUNT
	@echo "You must specify an amount to send with COLD_STORAGE_AMOUNT="
else
	@docker run --rm \
	--link mongo_amb_primary:mongo \
	--link bitcoind_amb_player:bitcoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/cold-storage $(COLD_STORAGE_ADDRESS) $(COLD_STORAGE_AMOUNT)
endif

appkey:
	docker run --rm \
		--link mongo_amb_primary:mongo \
		--env-file $(ENVFILE) \
		$(NAME):$(VERSION) -- node /app/src/bin/app-keygen --app $(APP)

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

envfile:
	@[ -f $(ENVFILE) ]

remove:
	-docker rm -f $(CONTAINER_NAME)

stop:
	docker stop $(CONTAINER_NAME)

start:
	docker start $(CONTAINER_NAME)

test:
	grunt test


.PHONY: test
