FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN mkdir /etc/service/node-server /frontend
RUN touch /var/log/node-server.log

RUN echo '#!/usr/bin/env bash' >> /etc/service/node-server/run
RUN echo 'cd /frontend && node server --loc $LOC >> /var/log/node-server.log' >> /etc/service/node-server/run
RUN chmod +x /etc/service/node-server/run

RUN cd /frontend && npm install send yargs

ADD src/home-ng/build/ /frontend/home-ng/build
ADD src/home-ng/node_modules/common-ng/ /frontend/home-ng/node_modules/common-ng
ADD src/circle-ng/build/ /frontend/circle-ng/build
ADD src/circle-ng/node_modules/common-ng/ /frontend/circle-ng/node_modules/common-ng
ADD src/common-ng/server.js /frontend/

CMD ["--", "tailf", "/var/log/node-server.log"]

EXPOSE 3002

