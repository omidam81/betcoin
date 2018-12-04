FROM docker.betcoin.tm/baseimage:0.2.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get update && apt-get -y install git

ENV GOPATH /root/go

ENV DOCKERGEN /root/go/bin/docker-gen

ENV ETCD /root/go/bin/etcd

RUN mkdir $GOPATH

ADD godeb /usr/bin/godeb

RUN godeb install

RUN go get github.com/jwilder/docker-gen

RUN mkdir /etc/service/docker-gen

ADD etcd-update.tmpl /etcd-update.tmpl

ADD runit/docker-gen.sh /etc/service/docker-gen/run

RUN ln -s /docker.sock /var/run/docker.sock

ENTRYPOINT ["/sbin/my_init"]

CMD ["--"]
