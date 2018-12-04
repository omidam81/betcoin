NAME=docker.betcoin.tm/frontend
VERSION=latest
BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)

all:
	docker build -t $(NAME):$(VERSION) .

common:
	-git clone git@bitbucket.org:betcn/common-ng src/common-ng

home:
	-git clone git@bitbucket.org:betcn/home-ng src/home-ng

circle:
	-git clone git@bitbucket.org:betcn/circle-ng src/circle-ng

branch:
	cd src && \
	cd common-ng && git fetch && git checkout origin/$(BRANCH) && cd ../ && \
	cd home-ng && git fetch && git checkout origin/$(BRANCH) && cd ../ && \
	cd circle-ng && git fetch && git checkout origin/$(BRANCH)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: envfile
	docker rm -f frontend_server; docker run \
	--env-file $(ENVFILE) \
	--name frontend_server \
	-d $(NAME):$(VERSION) && docker attach --no-stdin=true --sig-proxy=false frontend_server

shell: envfile
	docker rm -f frontend_server; docker run \
	--env-file $(ENVFILE) \
	--name frontend_server \
	-it $(NAME):$(VERSION) -- bash -l

envfile:
	[ -f $(ENVFILE) ]

remove:
	docker rm -f frontend_server

stop:
	docker stop frontend_server

start:
	docker start frontend_server


