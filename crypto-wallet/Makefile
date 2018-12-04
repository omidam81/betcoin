COIN=
NAME=docker.betcoin.tm/$(COIN)
BUILDFLAGS=
VERSION=latest

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/$(COIN)-run.log
APP_LOGFILE=$(PWD)/$(COIN)-app-run.log
DATA=$(PWD)/../volumes/$(COIN)

PORT=
RPCPORT=
TESTNET=

CONTAINER_NAME=$(COIN)d
MONGO_CONTAINER=mongo_amb_primary

container: test checkcoin clean dockerfile
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

clean:
	rm -f Dockerfile

checkcoin:
	@if [ "$(COIN)" != "bitcoin" ] \
		&& [ "$(COIN)" != "litecoin" ] \
		&& [ "$(COIN)" != "dogecoin" ] \
		&& [ "$(COIN)" != "ppcoin" ] \
		&& [ "$(COIN)" != "namecoin" ]; \
then echo "Invalid coin $(COIN)" && exit 1; fi

datadir:
	@if [ -z "$(DATA)" ] || [ ! -d "$(DATA)" ]; \
		then echo "Missing data directory $(DATA)" && exit 2; fi

dockerfile: checkcoin
	cat dockerfiles/header dockerfiles/$(COIN) dockerfiles/footer dockerfiles/$(COIN)-footer > Dockerfile

ports: checkcoin
ifeq ($(COIN),bitcoin)
ifdef TESTNET
PORT=18333
RPCPORT=18332
else
PORT=8333
RPCPORT=8332
endif
else ifeq ($(COIN),litecoin)
ifdef TESTNET
PORT=19333
RPCPORT=19332
else
PORT=9333
RPCPORT=9332
endif
else ifeq ($(COIN),dogecoin)
ifdef TESTNET
PORT=44556
RPCPORT=44555
else
PORT=22556
RPCPORT=22555
endif
else ifeq ($(COIN),ppcoin)
ifdef TESTNET
PORT=9903
RPCPORT=9902
else
PORT=9901
RPCPORT=9902
endif
else ifeq ($(COIN),namecoin)
ifdef TESTNET
PORT=18334
RPCPORT=18336
else
PORT=8334
RPCPORT=8336
endif
endif

logfile:
	@[ -f $(LOGFILE) ] || touch $(LOGFILE)
	@[ -f $(APP_LOGFILE) ] || touch $(APP_LOGFILE)

envfile:
	@if [ ! -f $(ENVFILE) ]; then echo "Missing env file $(ENVFILE)" && exit 3; fi

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest

push:
	docker push $(NAME):$(VERSION)

pull:
ifneq ($(VERSION),latest)
	docker pull $(NAME):$(VERSION) && docker pull $(NAME):latest
else
	docker pull $(NAME):$(VERSION)
endif

run: checkcoin remove datadir logfile envfile
	docker run -d \
		--link $(MONGO_CONTAINER):mongo \
		-v $(LOGFILE):/var/log/$(COIN)d.log \
		-v $(APP_LOGFILE):/var/log/app.log \
		-v $(DATA):/home/app/.$(COIN) \
		--env-file $(ENVFILE) \
		-e CRYPTO_TYPE=$(COIN) \
		-p $(PORT):$(PORT) \
		--expose $(RPCPORT) \
		--expose 1337 \
		--name $(CONTAINER_NAME) \
		$(NAME):$(VERSION)
	docker run -d \
		--link $(CONTAINER_NAME):$(CONTAINER_NAME) \
		--expose 1337 --expose $(RPCPORT) \
		--name $(CONTAINER_NAME)_amb \
		svendowideit/ambassador

shell: checkcoin remove datadir logfile envfile
	docker run --rm -it \
		--link $(MONGO_CONTAINER):mongo \
		-v $(LOGFILE):/var/log/$(COIN)d.log \
		-v $(APP_LOGFILE):/var/log/app.log \
		-v $(DATA):/home/app/.$(COIN) \
		--env-file $(ENVFILE) \
		-e CRYPTO_TYPE=$(COIN) \
		-p $(PORT):$(PORT) \
		--name $(CONTAINER_NAME) \
		$(NAME):$(VERSION) -- bash -l

unlockwallet: envfile
	docker run --rm \
		--entrypoint bash \
		--env-file $(ENVFILE) \
		-it $(NAME):$(VERSION) -c 'echo -n "password: " && read password && '$(COIN)'d walletpassphrase "$password" 360000000'

remove:
	-@docker rm -f $(CONTAINER_NAME)_amb $(CONTAINER_NAME)

stop:
	docker stop $(CONTAINER_NAME)_amb $(CONTAINER_NAME)

start:
	docker start $(CONTAINER_NAME) $(CONTAINER_NAME)_amb

test:
	grunt test


.PHONY: test
