NAME=docker.betcoin.tm/docker-proxy
BUILDFLAGS=
VERSION=latest

LOGFILE=$(PWD)/../../logs/nginx-proxy.log

all: godeb
	docker build $(BUILDFLAGS) -t $(NAME):$(VERSION) .

godeb:
	[ ! -f ./godeb ] && wget https://godeb.s3.amazonaws.com/godeb-amd64.tar.gz \
	&& tar xzvf godeb-amd64.tar.gz && rm godeb-amd64.tar.gz

logfile:
	[ -f $(LOGFILE) ] || touch $(LOGFILE)

run: logfile
	docker rm -f nginx_proxy; \
	docker run \
	-p 1337:1337 \
		-p 440:440 \
		-p 441:441 \
		-p 442:442 \
		-p 443:443 \
		-p 444:444 \
		-p 445:445 \
		-p 446:446 \
		-p 8446:8446 \
		-p 8445:8445 \
		-p 8444:8444 \
		-p 8443:8443 \
		-p 8442:8442 \
		-p 8441:8441 \
		-p 8440:8440 \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		-v $(LOGFILE):/var/log/nginx/error.log \
		--name nginx_proxy \
		-d $(NAME):$(VERSION)

shell: logfile
	docker rm -f nginx_proxy; \
	docker run \
		-p 1337:1337 \
		-p 440:440 \
		-p 441:441 \
		-p 442:442 \
		-p 443:443 \
		-p 444:444 \
		-p 445:445 \
		-p 446:446 \
		-p 8446:8446 \
		-p 8445:8445 \
		-p 8444:8444 \
		-p 8443:8443 \
		-p 8442:8442 \
		-p 8441:8441 \
		-p 8440:8440 \
		-v /var/run/docker.sock:/docker.sock \
		-c 2 \
		-v $(LOGFILE):/var/log/nginx/error.log \
		--name nginx_proxy \
		-it $(NAME):$(VERSION) -- bash -l

remove:
	docker rm -f nginx_proxy

stop:
	docker stop nginx_proxy

start:
	docker start nginx_proxy

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)


