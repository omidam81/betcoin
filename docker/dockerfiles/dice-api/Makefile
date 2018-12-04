NAME=docker.betcoin.tm/dice-node
VERSION=latest
BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/dice-node.log

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

all: git branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/dice-node src/dice-node

branch:
	cd src; cd dice-node && git fetch && git checkout origin/$(BRANCH)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: logfile envfile
	docker rm -f dice_node; docker run \
	--link mongo_amb_primary:mongo \
	--link dice_handler_node:dice_handler \
	-v $(LOGFILE):/var/log/dice-node.log \
	--env-file $(ENVFILE) \
	--name dice_node \
	-d $(NAME):$(VERSION) && tailf $(LOGFILE)

run-live: logfile envfile
	docker rm -f dice_node; docker run \
	--link mongo_amb_primary:mongo \
	--env-file $(ENVFILE) \
	-v $(LOGFILE):/var/log/dice-node.log \
	--name dice_node \
	-d $(NAME):$(VERSION) && tailf $(LOGFILE)

envfile:
	[ -f $(ENVFILE) ]

clean:
	rm -rf src/dice-node/

remove:
	docker rm -f dice_node

stop:
	docker stop dice_node

start:
	docker start dice_node

