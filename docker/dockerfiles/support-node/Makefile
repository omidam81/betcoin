NAME=docker.betcoin.tm/support-node
VERSION=latest
BRANCH=master
AUTH_BRANCH=master

SUFFIX=mainnet
RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/../../logs/support-node.log

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

all: git bcauth branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/support-node src/support-node

bcauth:
	-git clone git@bitbucket.org:betcn/auth-npm src/auth-npm

branch:
	cd src; cd support-node && git fetch && git checkout origin/$(BRANCH) && cd ../auth-npm && \
	git fetch && git checkout origin/$(AUTH_BRANCH);

run: envfile logfile
	docker rm -f support_node; docker run \
	--link mongo_amb_primary:mongo \
	--env-file $(ENVFILE) \
	-v $(LOGFILE):/var/log/support-node.log \
	--name support_node \
	-d $(NAME):$(VERSION) && tailf $(LOGFILE)

run-live: envfile
	docker rm -f support_node; docker run \
	--link mongo_amb_primary:mongo \
	--env-file $(ENVFILE) \
	--name support_node \
	-d $(NAME):$(VERSION) && docker attach --no-stdin=true --sig-proxy=false support_node

shell: envfile
	docker rm -f support_node; docker run \
	--link mongo_amb_primary:mongo \
	--env-file $(ENVFILE) \
	--name support_node \
	-it $(NAME):$(VERSION) -- bash -l

envfile:
	[ -f $(ENVFILE) ]

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

clean:
	rm -rf src/support-node/ src/auth-npm
