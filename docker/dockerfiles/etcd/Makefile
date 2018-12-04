NAME=docker.betcoin.tm/etcd
BUILDFLAGS=
VERSION=latest

LOGFILE=$(PWD)/../../logs/etcd.log

all: godeb
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

godeb:
	[[ ! -f ./godeb ]] && wget https://godeb.s3.amazonaws.com/godeb-amd64.tar.gz \
	&& tar xzvf godeb-amd64.tar.gz && rm godeb-amd64.tar.gz

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

run: logfile
	docker rm -f etcd; \
	docker run \
		-p 4001:4001 \
		-c 2 \
		--name etcd \
		-d $(NAME):$(VERSION)

shell: logfile
	docker rm -f etcd; \
	docker run \
		-p 4001:4001 \
		-c 2 \
		--name etcd \
		-it $(NAME):$(VERSION) -- bash -l

remove:
	docker rm -f etcd

stop:
	docker stop etcd

start:
	docker start etcd

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)


