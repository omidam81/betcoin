NAME=docker.betcoin.tm/circle-node
VERSION=latest
BRANCH=master
INTERFACE_BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/circle-node.log

all: git playerinterface branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/circle-node src/circle-node

playerinterface:
	-git clone git@bitbucket.org:betcn/player-interface-node src/player-interface-node

branch:
	cd src; cd circle-node && git fetch && git checkout origin/$(BRANCH) && cd ../player-interface-node && \
	git fetch && git checkout origin/$(INTERFACE_BRANCH);

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: envfile logfile
	docker rm -f circle_node; docker run \
	--link mongo_amb_primary:mongo \
	--link player_node:player_server \
	--env-file $(ENVFILE) \
	--name circle_node \
	-v $(LOGFILE):/var/log/circle-node.log \
	--expose 8443 \
	-d $(NAME):$(VERSION)

run-live: envfile logfile
	docker rm -f circle_node; docker run \
	--link mongo_amb_primary:mongo \
	--link player_node:player_server \
	--env-file $(ENVFILE) \
	-v $(LOGFILE):/var/log/circle-node.log \
	--name circle_node \
	-d $(NAME):$(VERSION)

envfile:
	[ -f $(ENVFILE) ]

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

clean:
	rm -rf src/circle-node/ src/player-interface-node/

remove:
	docker rm -f circle_node

stop:
	docker stop circle_node

start:
	docker start circle_node


