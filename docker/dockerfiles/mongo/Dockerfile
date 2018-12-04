FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

RUN echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' > /etc/apt/sources.list.d/mongodb.list

RUN apt-get update --fix-missing

RUN apt-get -y install mongodb-10gen=2.4.8

RUN mkdir /etc/service/mongo; \
        echo "#!/usr/bin/env bash" > /etc/service/mongo/run; \
        echo "chown -R mongodb:65535 /data" >> /etc/service/mongo/run; \
        echo "exec /sbin/setuser mongodb /usr/bin/mongod -f /data/mongod.conf >> /var/log/mongod.log 2>&1" >> /etc/service/mongo/run; \
        chmod +x /etc/service/mongo/run;

EXPOSE 27017

CMD ["--", "tailf", "/data/mongod.log"]
