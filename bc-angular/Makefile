# vars for html building
PROD=all
LOC=en_US
CONF=live
GRUNT_TASKS=default
CDN=false

#vars for docker
NAME=docker.betcoin.tm/bc-angular
BUILDFLAGS=
VERSION=latest

CONTAINER_NAME=frontend
RUNENV=default
ENVFILE=$(PWD)/env/$(RUNENV)
LOGFILE=$(PWD)/run.log
CN_LOGFILE=$(PWD)/run-cn.log
DEV_BRANCH=dev
DEV_CONF=dev

# html targets
html: loc conf
	@echo "Building $(PROD) ($(LOC))"
	@echo "Getting NPM packages"
	@[ -d node_modules ] || npm install >/dev/null
ifeq ($(PROD),all)
	@grunt --prod home --loc $(LOC) --cdn $(CDN) --conf $(CONF) $(GRUNT_TASKS)
	@for app in apps/*; do \
		app=$${app#apps/}; \
		echo "Building $$app"; \
		grunt --prod $$app --loc $(LOC) --cdn $(CDN) --conf $(CONF) $(GRUNT_TASKS) || exit 4; \
	done
else
	grunt --prod $(PROD) --loc $(LOC) --cdn $(CDN) --conf $(CONF) $(GRUNT_TASKS)
endif

devupdate:
	git checkout $(DEV_BRANCH) && git pull
	$(MAKE) CONF=$(DEV_CONF) html
	$(MAKE) CONF=$(DEV_CONF) LOC=zh_CN html

allloc:
	$(MAKE)
	$(MAKE) LOC=zh_CN

loc:
ifeq ($(LOC),en_US)
else ifeq ($(LOC),zh_CN)
else
	@echo "Invalid LOC $(LOC)" && exit 1;
endif

conf:
	@if [ ! -f config/$(CONF).js ]; then echo "Missing conf file config/$(CONF).js" && exit 2; fi

clean:
	@rm -rf build tmp dist >/dev/null 2>&1

#docker targets
container: dockerfile
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

dockerfile:
	@rm -f Dockerfile
	@cat dockerfiles/header dockerfiles/$(CONF) dockerfiles/footer > Dockerfile

logfile:
	@[ -f $(LOGFILE) ] || touch $(LOGFILE)
	@[ -f $(CN_LOGFILE) ] || touch $(CN_LOGFILE)

envfile:
	@if [ ! -f $(ENVFILE) ]; then echo "Missing env file $(ENVFILE)" && exit 3; fi
	@if [ ! -f $(ENVFILE)-cn ]; then echo "Missing env file $(ENVFILE)-cn" && exit 3; fi

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest
test:
	grunt jshint --prod home
push:
	docker push $(NAME):$(VERSION)

pull:
ifneq ($(VERSION),latest)
	docker pull $(NAME):$(VERSION) && docker pull $(NAME):latest
else
	docker pull $(NAME):$(VERSION)
endif

run: remove logfile envfile
	docker run -d \
		-v $(LOGFILE):/var/log/app.log \
		--env-file $(ENVFILE) \
		--name $(CONTAINER_NAME) \
		$(NAME):$(VERSION)
	docker run -d \
		-v $(CN_LOGFILE):/var/log/app.log \
		--env-file $(ENVFILE)-cn \
		--name $(CONTAINER_NAME)_cn \
		$(NAME):$(VERSION)

remove:
	@-docker rm -f $(CONTAINER_NAME) $(CONTAINER_NAME)_cn
