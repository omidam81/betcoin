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

RUN go get github.com/coreos/etcd

RUN mkdir /etc/service/etcd

ADD runit/etcd.sh /etc/service/etcd/run

ENTRYPOINT ["/sbin/my_init"]

CMD ["--"]
