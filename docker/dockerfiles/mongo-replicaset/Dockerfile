FROM docker.betcoin.tm/mongod
MAINTAINER atticus

ENV HOME /root

RUN rm -rf /etc/service/mongo && mkdir /etc/service/primary /etc/service/secondary /etc/service/arbitor;

ADD runit/primary /etc/service/primary/run
ADD runit/secondary /etc/service/secondary/run
ADD runit/arbitor /etc/service/arbitor/run

EXPOSE 27017 27018 27019

CMD ["--"]
