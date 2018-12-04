NAME=docker.betcoin.tm/etcd-updater
BUILDFLAGS=
VERSION=latest

LOGFILE=$(PWD)/../../logs/etcd.log
CONTAINER_NAME=etcd_updater

all: godeb
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

godeb:
	[[ ! -f ./godeb ]] && wget https://godeb.s3.amazonaws.com/godeb-amd64.tar.gz \
	&& tar xzvf godeb-amd64.tar.gz && rm godeb-amd64.tar.gz

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

run: logfile
	docker rm -f $(CONTAINER_NAME); \
	docker run \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		--name $(CONTAINER_NAME) \
		-d $(NAME):$(VERSION)

shell: logfile
	docker rm -f $(CONTAINER_NAME); \
	docker run \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		--name $(CONTAINER_NAME) \
		-it $(NAME):$(VERSION) -- bash -l

remove:
	docker rm -f $(CONTAINER_NAME)

stop:
	docker stop $(CONTAINER_NAME)

start:
	docker start $(CONTAINER_NAME)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)


