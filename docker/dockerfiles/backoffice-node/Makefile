NAME=docker.betcoin.tm/backoffice-node
VERSION=latest
BRANCH=master
INTERFACE_BRANCH=master

RUNENV=default
SUFFIX=mainnet
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/backoffice-node.log

all: git auth wallet playerinterface logger branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/backoffice-node src/backoffice-node

auth:
	-git clone git@bitbucket.org:betcn/auth-npm src/auth-npm

playerinterface:
	-git clone git@bitbucket.org:betcn/player-interface-node src/player-interface-node

wallet:
	-git clone git@bitbucket.org:betcn/bitcoin-wallet src/bitcoin-wallet

logger:
	-git clone git@bitbucket.org:betcn/logger-npm src/logger-npm

branch:
	cd src; cd backoffice-node && git fetch && git checkout origin/$(BRANCH) && cd ../player-interface-node && \
	git fetch && git checkout origin/$(INTERFACE_BRANCH);

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: envfile logfile
	docker rm -f backoffice_node; docker run \
	--link mongo_amb_primary:mongo_primary \
	--link mongo_amb_primary:mongo \
	--link mongo_amb_secondary:mongo_secondary \
	--link bitcoind_amb_player:bitcoind \
	--link player_node:player_server \
	--env-file $(ENVFILE) \
	-v $(LOGFILE):/var/log/backoffice-node.log \
	--name backoffice_node \
	--expose 8443 \
	-d $(NAME):$(VERSION) && tailf $(LOGFILE)

shell: envfile logfile
	docker run --rm \
	--link mongo_amb_primary:mongo_primary \
	--link mongo_amb_secondary:mongo_secondary \
	--env-file $(ENVFILE) \
	--entrypoint bash \
	--expose 8443 \
	-it $(NAME):$(VERSION) -l

envfile:
	[ -f $(ENVFILE) ]

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

clean:
	rm -rf src/backoffice-node/

remove:
	docker rm -f backoffice_node

stop:
	docker stop backoffice_node

start:
	docker start backoffice_node


