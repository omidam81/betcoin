NAME=docker.betcoin.tm/mongod
VERSION=latest

MONGO_USER=admin
MONGO_PASSWORD=
MONGO_IP=
MONGO_PORT=27017

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

shell:
	[ -z "$(MONGO_IP)" ] \
	&& exit 2 \
	|| docker run --rm \
		--entrypoint mongo \
		-it $(NAME) -u $(MONGO_USER) -p $(MONGO_PASSWORD) -host $(MONGO_IP) -port $(MONGO_PORT) admin

run: volume
	docker rm -f mongod_$(SUFFIX); \
	docker run \
		-v $(DATA):/data \
		--name mongod_$(SUFFIX) \
		-d $(NAME) && \
	docker rm -f mongo_amb_primary; \
	docker run \
		--link mongod_$(SUFFIX):mongod \
		--expose 27017 \
		--name mongo_amb_primary \
		-d svendowideit/ambassador

run-live:
	docker run \
		--env-file $(PWD)/env/primary \
		--expose 27017 \
		--name mongo_amb_primary \
		-d svendowideit/ambassador && \
	docker run \
		--env-file $(PWD)/env/secondary \
		--expose 27017 \
		--name mongo_amb_secondary \
		-d svendowideit/ambassador

remove:
	docker rm -f mongod_$(SUFFIX) mongo_amb_primary mongo_amb_secondary

stop:
	docker stop mongo_amb_secondary mongo_amb_primary mongod_$(SUFFIX)

start:
	docker start mongod_$(SUFFIX) mongo_amb_primary mongo_amb_secondary
