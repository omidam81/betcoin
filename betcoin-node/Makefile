NAME=docker.betcoin.tm/betcoin-node
BUILDFLAGS=
VERSION=latest
TEST=false

RUNENV=default
SERVICE_RUNENV=service
ENVFILE=$(PWD)/env/$(RUNENV)
SERVICE_ENVFILE=$(PWD)/env/$(SERVICE_RUNENV)
LOGFILE=$(PWD)/run.log
SERVICE_LOGFILE=$(PWD)/service.log
BIN_FILE=

COLD_STORAGE_ADDRESS=1Dhd2V19w7zLaXrK1zPp2eES6Km1cBVzDs
COLD_STORAGE_AMOUNT=
CONTAINER_NAME=betcoin_node
BITCOIND_CONTAINER=bitcoind_amb
LITECOIND_CONTAINER=litecoind_amb
DOGECOIND_CONTAINER=dogecoind_amb
PPCOIND_CONTAINER=ppcoind_amb
NAMECOIND_CONTAINER=namecoind_amb
MONGO_IMAGE=docker.betcoin.tm/mongod-replicaset
MONGO_CONTAINER=mongo_amb_primary
PROXY_IMAGE=docker.betcoin.tm/docker-proxy

MONGO_DATA=$(PWD)/../volumes/mongo

GRUNT_TASK=simplemocha:api
REPORTER=spec

REPO_DIR=$(PWD)

container:
	$(MAKE) app-container
	$(MAKE) service-container

app-container:
	@grunt jshint
	@cp dockerfiles/prod Dockerfile
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

service-container:
	@grunt jshint
	@cp dockerfiles/service Dockerfile
	docker build $(BUILDFLAGS) -t $(NAME)-service:$(VERSION) .

testbuild: bootstrap logfile envfile
	@grunt jshint 1>&2
	@cp dockerfiles/test Dockerfile
	@echo "Building container" 1>&2
	@docker build --quiet $(BUILDFLAGS) -t $(NAME)-testimage:$(VERSION) . 1>&2
	@docker run --rm  \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	-e MOCHA_TEST=true \
	--entrypoint /sbin/setuser \
	-w /app \
	$(NAME)-testimage:$(VERSION) app make REPORTER=$(REPORTER) GRUNT_TASK=$(GRUNT_TASK) test

# this target will build once and then mount the src and test folders
# so you can run tests without waiting for rebuilds

# if you change anything outside of the src and test directories, you
# must exit the shell and run `make testshell' again
testshell: bootstrap logfile envfile
	@grunt jshint 1>&2
	@cp dockerfiles/test Dockerfile
	@echo "Building container" 1>&2
	@docker build --quiet $(BUILDFLAGS) -t $(NAME)-testimage:$(VERSION) . 1>&2
	if [ -z "$$UID" ]; then UID=$$(bash -c 'echo $$UID'); fi; GID=$$(bash -c 'echo $$GROUPS'); docker run --rm \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	--expose 8443 \
	-v $(LOGFILE):/var/log/app.log \
	-v $(PWD):/app \
	-c 2 \
	--env-file $(ENVFILE) \
	-e MOCHA_TEST=true \
	--entrypoint bash \
	-h testshell \
	--name $(CONTAINER_NAME)_testshell \
	-w /app \
	-it $(NAME)-testimage:$(VERSION) -c 'groupadd -g '$$GID' test && useradd -u '$$UID' -g '$$GID' test && chown -R test:test /app && bash -l'

bootstrap:
	@echo "Bootstrapping"
ifndef LIVE
ifndef DEV
	@bash bin/bootstrap.sh
else
	@bash bin/bootstrap-dev.sh
endif
else
	@bash bin/bootstrap-live.sh
endif

mongo: mongovolume
	docker rm -f mongod; \
	docker run \
			-v $(MONGO_DATA):/data \
			-c 2 \
			-h mongod \
			--name mongod \
			-d $(MONGO_IMAGE) && \
	docker rm -f mongo_amb_primary; \
	docker run \
			--link mongod:mongod \
			--expose 27017 \
			--name mongo_amb_primary \
			-d svendowideit/ambassador && \
	docker rm -f mongo_amb_secondary; \
	docker run \
			--link mongod:mongod \
			--expose 27018 \
			--name mongo_amb_secondary \
			-d svendowideit/ambassador

mongo-live:
	-docker rm -f mongo_amb_primary mongo_amb_secondary
	docker run \
		--env-file $(PWD)/env/mongo-primary \
		--expose 27017 \
		--name mongo_amb_primary \
		-d svendowideit/ambassador
	docker run \
		--env-file $(PWD)/env/mongo-secondary \
		--expose 27017 \
		--name mongo_amb_secondary \
		-d svendowideit/ambassador

mongo-shell:
	docker run --rm --entrypoint mongo -it docker.betcoin.tm/mongod \
		-u admin -p -host $$($(REPO_DIR)/bin/dockr ip mongo_amb_primary) admin

mongovolume:
	[ -d $(MONGO_DATA) ]

proxy:
	docker rm -f nginx_proxy; \
	docker run \
		-p 443:443 \
		-p 8443:8443 \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		--name nginx_proxy \
		-d $(PROXY_IMAGE)

coins:
	[ -d $(REPO_DIR)/../crypto-wallet ]
	cd $(REPO_DIR)/../crypto-wallet && $(MAKE) COIN=bitcoin TESTNET=true run; \
	for coin in litecoin dogecoin ppcoin namecoin;\
	do \
		cd $(REPO_DIR)/../crypto-wallet && $(MAKE) COIN=$$coin run; \
	done;

coins-live:
	[ -d	 $(REPO_DIR)/../crypto-wallet ]
	for coin in bitcoin litecoin dogecoin ppcoin namecoin;\
	do \
		cd $(REPO_DIR)/../crypto-wallet && $(MAKE) DATA=/media/blockchains/$$coin COIN=$$coin run; \
	done;


taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest
	docker tag $(NAME)-service:$(VERSION) $(NAME)-service:latest

push:
	docker push $(NAME):$(VERSION)
	docker push $(NAME)-service:$(VERSION)

pull:
ifeq ($(VERSION),latest)
	docker pull $(NAME):$(VERSION)
	docker pull $(NAME)-service:$(VERSION)
else
	docker pull $(NAME):$(VERSION) && docker pull $(NAME):latest;
	docker pull $(NAME)-service:$(VERSION) && docker pull $(NAME)-service:latest;
endif

run: bootstrap envfile logfile remove run-service
	docker run \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-d $(NAME):$(VERSION)

run-service: bootstrap service-envfile service-logfile service-remove
	docker run \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	-v $(SERVICE_LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(SERVICE_ENVFILE) \
	--name $(CONTAINER_NAME)_service \
	-d $(NAME)-service:$(VERSION)

shell: bootstrap envfile logfile remove
	docker run \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-it $(NAME):$(VERSION) -- bash -l

bin:
	[ -n $(BIN_FILE) ] || exit 1
	docker run --rm \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/$(BIN_FILE)

unlockwallet: envfile
	docker run --rm \
		--entrypoint bash \
		--env-file $(ENVFILE) \
		-it $(NAME):$(VERSION) -c 'echo -n "password: " && read password && curl "http://bitcoind_amb:8332" --user "$RPCUSER:$RPCPASSWORD" --data-binary \'{"jsonrpc":"1.0", "id":"letmein", "method":"walletpassphrase", "params":["\'$password\'", 36000000]}\' -H "content-type: text/plain;"'


cashback: envfile
	docker run --rm \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/give-cashback

payout: envfile
	@docker run --rm \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/pay-pending

coldstorage: envfile
ifndef COLD_STORAGE_AMOUNT
	@echo "You must specify an amount to send with COLD_STORAGE_AMOUNT="
else
	@docker run --rm \
	--link $(MONGO_CONTAINER):mongod \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(LITECOIND_CONTAINER):litecoind \
	--link $(DOGECOIND_CONTAINER):dogecoind \
	--link $(PPCOIND_CONTAINER):ppcoind \
	--link $(NAMECOIND_CONTAINER):namecoind \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/cold-storage $(COLD_STORAGE_ADDRESS) $(COLD_STORAGE_AMOUNT)
endif

appkey:
	docker run --rm \
		--link $(MONGO_CONTAINER):mongod \
		--env-file $(ENVFILE) \
		$(NAME):$(VERSION) -- node /app/src/bin/app-keygen --app $(APP)

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

service-logfile:
	[ -f $(SERVICE_LOGFILE) ] || touch $(SERVICE_LOGFILE)

envfile:
	@[ -f $(ENVFILE) ]

service-envfile:
	@[ -f $(SERVICE_ENVFILE) ]

remove:
	-docker rm -f $(CONTAINER_NAME)

service-remove:
	-docker rm -f $(CONTAINER_NAME)_service

stop:
	docker stop $(CONTAINER_NAME)

start:
	docker start $(CONTAINER_NAME)

test:
	@grunt jshint 1>&2
	@grunt $(GRUNT_TASK) --reporter $(REPORTER)

testdocs:
	@$(MAKE) testbuild REPORTER=markdown >testdoc.md
	@sed -i '/simplemocha/d' testdoc.md
	@sed -i '/Done,/d' testdoc.md
	@sed -i '/^make/d' testdoc.md

tmux:
	@./bin/tmux.sh

.PHONY: test
