NAME=docker.betcoin.tm/baccpo-node
BUILDFLAGS=
VERSION=latest

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/run.log

CONTAINER_NAME=baccpo_node
MONGO_CONTAINER=mongo_amb_primary
PLAYER_CONTAINER=player_node
GAMES=1000000

all: test
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION) && [ "$(VERSION)" = "latest" ] || docker pull $(NAME):latest;

run: envfile logfile remove
	docker run \
	--link $(MONGO_CONTAINER):mongo \
	--link $(PLAYER_CONTAINER):player_server \
	-v $(LOGFILE):/var/log/app.log \
	--env-file $(ENVFILE) \
	--name $(CONTAINER_NAME) \
	-d $(NAME):$(VERSION)

shell: envfile logfile
	docker run --rm \
	--link $(MONGO_CONTAINER):mongo \
	--link $(PLAYER_CONTAINER):player_server \
	-v $(LOGFILE):/var/log/app.log \
	--env-file $(ENVFILE) \
	-it $(NAME):$(VERSION) -- bash -l

simulation: envfile
	docker run --rm \
	--link $(MONGO_CONTAINER):mongo \
	--link $(PLAYER_CONTAINER):player_server \
	--env-file $(ENVFILE) \
	--entrypoint node \
	-it $(NAME):$(VERSION) /app/src/bin/simulate --games $(GAMES)

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


taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest
