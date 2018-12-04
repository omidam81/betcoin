NAME=docker.betcoin.tm/cms-node
VERSION=latest
BRANCH=master
AUTH_BRANCH=master

all: git bcauth branch
	docker build -t $(NAME):$(VERSION) .

git:
	-git clone git@bitbucket.org:betcn/cms-node src/cms-node

bcauth:
	-git clone git@bitbucket.org:betcn/auth-npm src/auth-npm

branch:
	cd src; cd cms-node && git fetch && git checkout origin/$(BRANCH) && cd ../auth-npm && \
	git fetch && git checkout origin/$(AUTH_BRANCH);

run: envfile
	docker rm -f cms_node; docker run \
	--link mongo_amb_primary:mongo \
	--env-file $(ENVFILE) \
	--name cms_node \
	--expose 8443 \
	-d $(NAME):$(VERSION) && docker attach --no-stdin=true --sig-proxy=false cms_node

envfile:
	[ -f $(ENVFILE) ]

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

clean:
	rm -rf src/cms-node/ src/auth-npm
