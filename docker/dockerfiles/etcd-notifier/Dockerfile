FROM docker.betcoin.tm/baseimage
MAINTAINER atticus

RUN apt-get install -qqy iptables ca-certificates lxc

ADD package.json /

RUN cd / && npm install

ADD etcd-notify.js /etcd-notify.js

ADD https://get.docker.io/builds/Linux/x86_64/docker-latest /usr/bin/docker

RUN chmod +x /usr/bin/docker

ENTRYPOINT ["node", "/etcd-notify.js"]
