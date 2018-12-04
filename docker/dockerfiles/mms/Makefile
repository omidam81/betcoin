NAME=docker.betcoin.tm/mms-agent
VERSION=latest

all:
	docker build -t $(NAME):$(VERSION) - < Dockerfile

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)

