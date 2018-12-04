NAME=docker.betcoin.tm/appbase
VERSION=latest

all: key
	docker build -t $(NAME):$(VERSION) .

key:
	if [[ ! -f ./key ]]; \
	then \
		echo -n "You need an ssh key here" && exit 1; \
	fi

push:
	docker push $(NAME):$(VERSION)

pull:
	docker pull $(NAME):$(VERSION)
