NAME=docker.betcoin.tm/bitlox
VERSION=latest

CONTAINER_NAME=bitlox

ENV_FILE=default

MYSQL_CONTAINER=bitlox_mysql
MYSQL_ENV_FILE=mysql

PROXY_IMAGE=docker.betcoin.tm/docker-proxy

container:
	docker build -t $(NAME):$(VERSION) .

run: settings remove
	docker run \
	--link $(MYSQL_CONTAINER):mysql \
	--name $(CONTAINER_NAME) \
	--env-file env/$(ENV_FILE) \
	-v $(PWD)/settings.inc.php:/var/www/html/config/settings.inc.php \
	-p 80:80 \
	-d $(NAME):$(VERSION)

settings:
	@touch settings.inc.php

mysql: remove-mysql
	docker run -d \
		--name $(MYSQL_CONTAINER) \
		--env-file env/$(MYSQL_ENV_FILE) \
		mysql
proxy:
	docker rm -f nginx_proxy; \
	docker run \
		-p 443:443 \
		-p 8443:8443 \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		--name nginx_proxy \
		-d $(PROXY_IMAGE)

remove:
	@-docker rm -f $(CONTAINER_NAME)

remove-mysql:
	@-docker rm -f $(MYSQL_CONTAINER)
