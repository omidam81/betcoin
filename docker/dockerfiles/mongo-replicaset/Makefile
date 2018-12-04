NAME=docker.betcoin.tm/mongod-replicaset
VERSION=latest

SUFFIX=mainnet
DATA=$(PWD)/../../volumes/mongod-$(SUFFIX)

all:
	docker build -t $(NAME):$(VERSION) ./

volume:
	[ -d $(DATA) ]

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: volume
	docker rm -f mongod_$(SUFFIX); \
	docker run \
		-v $(DATA):/data \
		-c 2 \
		-h mongo-repl \
		--name mongod_$(SUFFIX) \
		-d $(NAME) && \
	docker rm -f mongo_amb_primary; \
	docker run \
		--link mongod_$(SUFFIX):mongod \
		--expose 27017 \
		--name mongo_amb_primary \
		-d svendowideit/ambassador && \
	docker rm -f mongo_amb_secondary; \
	docker run \
		--link mongod_$(SUFFIX):mongod \
		--expose 27018 \
		--name mongo_amb_secondary \
		-d svendowideit/ambassador

shell: volume
	docker run --rm \
		-h mongo-repl \
		-v $(DATA):/data \
		-it $(NAME) -- bash -l

remove:
	docker rm -f mongod_$(SUFFIX) mongo_amb_primary mongo_amb_secondary

stop:
	docker stop mongo_amb_primary mongo_amb_secondary mongod_$(SUFFIX)

start:
	docker start mongod_$(SUFFIX) mongo_amb_primary mongo_amb_secondary
