NAME=docker.betcoin.tm/baseimage
VERSION=latest

all:
	docker build -t $(NAME):$(VERSION) .

taglatest:
	docker tag $(NAME):$(VERSION) $(NAME):latest

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

shell:
	docker run --rm -it $(NAME) -- bash -l
