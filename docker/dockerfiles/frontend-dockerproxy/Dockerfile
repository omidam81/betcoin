FROM docker.betcoin.tm/baseimage:0.2.0
MAINTAINER atticus

ENV HOME /root

ENV nginx stable

RUN add-apt-repository ppa:nginx/$nginx

RUN apt-get update && apt-get -y install nginx git

ENV GOPATH /root/go

ENV DOCKERGEN /root/go/bin/docker-gen

RUN mkdir $GOPATH

ADD godeb /usr/bin/godeb

RUN godeb install

RUN go get github.com/jwilder/docker-gen

ADD ssl /ssl

RUN touch /var/log/nginx/error.log

RUN mkdir /etc/service/docker-gen /etc/service/nginx

ADD runit/docker-gen.sh /etc/service/docker-gen/run

ADD runit/nginx.sh /etc/service/nginx/run

ADD nginx.tmpl /nginx.tmpl

ADD nginx.conf /etc/nginx/nginx.conf

RUN ln -s /docker.sock /var/run/docker.sock

ENTRYPOINT ["/sbin/my_init"]

CMD ["--"]
