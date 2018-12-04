NAME=docker.betcoin.tm/dice-handler-node
BUILDFLAGS=
VERSION=latest

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/run.log

CONTAINER_NAME=dice_handler_node
BITCOIND_CONTAINER=bitcoind_amb_dice
MONGO_CONTAINER=mongo_amb_primary

all: test
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

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
	docker run --rm \
	--link $(MONGO_CONTAINER):mongo \
	--link $(BITCOIND_CONTAINER):bitcoind \
	-v $(LOGFILE):/var/log/app.log \
	--env-file $(ENVFILE) \
	-it $(NAME):$(VERSION) -- bash -l

gamegen: envfile
	docker run --rm \
	--link $(MONGO_CONTAINER):mongo \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--env-file $(ENVFILE) \
	$(NAME):$(VERSION) -- node /dice-handler-node/bin/generate-dice-secrets

addressgen: envfile
	docker run --rm \
	--link $(MONGO_CONTAINER):mongo \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--env-file $(ENVFILE) \
	$(NAME):$(VERSION) -- node /dice-handler-node/bin/generate-addresses

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

envfile:
	[ -f $(ENVFILE) ]

remove:
	-docker rm -f $(CONTAINER_NAME)

stop:
	docker stop $(CONTAINER_NAME)

start:
	docker start $(CONTAINER_NAME)

test:
	grunt test


.PHONY: test
