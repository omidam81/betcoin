NAME=docker.betcoin.tm/cache-node
VERSION=latest
BRANCH=master

RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/cache-node.log

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

all: git branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/cache-node src/cache-node

branch:
	cd src; cd cache-node && git fetch && git checkout origin/$(BRANCH)

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

run: envfile logfile
	docker rm -f cache_node; docker run \
	--env-file $(ENVFILE) \
	--name cache_node \
	-v $(LOGFILE):/var/log/cache-node.log \
	-d $(NAME):$(VERSION)

run-live: envfile logfile
	docker rm -f cache_node; docker run \
		--link mongo_amb_primary:mongo_primary \
		--link mongo_amb_secondary:mongo_secondary \
		--env-file $(ENVFILE) \
		-v $(LOGFILE):/var/log/app.log \
		--name cache_node \
		-d $(NAME):$(VERSION)

shell: envfile
	docker run --rm \
	--env-file $(ENVFILE) \
	--name cache_node \
	--expose 8443 \
	-it $(NAME):$(VERSION) -- bash -l

envfile:
	[ -f $(ENVFILE) ]

clean:
	rm -rf src/cache-node/

remove:
	docker rm -f cache_node

stop:
	docker stop cache_node

start:
	docker start cache_node


