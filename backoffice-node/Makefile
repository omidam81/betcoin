NAME=docker.betcoin.tm/backoffice-node
BUILDFLAGS=
VERSION=latest

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/run.log

CONTAINER_NAME=backoffice_node
BITCOIND_CONTAINER=bitcoind_amb_player
MONGO_PRIMARY_CONTAINER=mongo_amb_primary
MONGO_SECONDARY_CONTAINER=mongo_amb_secondary
PLAYER_CONTAINER=player_node

USERNAME=
PASSWORD=

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
	--link $(MONGO_PRIMARY_CONTAINER):mongo_primary \
	--link $(MONGO_PRIMARY_CONTAINER):mongo \
	--link $(MONGO_SECONDARY_CONTAINER):mongo_secondary \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(PLAYER_CONTAINER):player_server \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-d $(NAME):$(VERSION)

shell: envfile logfile remove
	docker run \
	--link $(MONGO_PRIMARY_CONTAINER):mongo_primary \
	--link $(MONGO_PRIMARY_CONTAINER):mongo \
	--link $(MONGO_SECONDARY_CONTAINER):mongo_secondary \
	--link $(BITCOIND_CONTAINER):bitcoind \
	--link $(PLAYER_CONTAINER):player_server \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-it $(NAME):$(VERSION) -- bash -l

create-user: envfile logfile
	@if [ -z $(USERNAME) ] || [ -z $(PASSWORD) ]; then echo "Provide USERNAME= and PASSWORD=" && exit 1; fi
	docker run --rm \
	--link $(MONGO_PRIMARY_CONTAINER):mongo \
	-v $(LOGFILE):/var/log/app.log \
	-c 2 \
	--env-file $(ENVFILE) \
	--entrypoint bash \
	-it $(NAME):$(VERSION) -c 'export MONGO_PRIMARY_URL=$$MONGO_PORT_27017_TCP; cd /app/ && npm install mongowrap && node /app/node_modules/auth-npm/bin/create-user --username '$(USERNAME)' --password '$(PASSWORD)

logfile:
	@[ -f $(LOGFILE) ] || touch $(LOGFILE)

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
