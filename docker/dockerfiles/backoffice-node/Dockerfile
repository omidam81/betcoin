FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /backoffice-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/backoffice-node/package.json /backoffice-node/
RUN sed -i '/git+ssh:/d' /backoffice-node/package.json

# install node modules
RUN cd /backoffice-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/backoffice-node
ADD runit/backoffice-node.sh /etc/service/backoffice-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/backoffice-node.log

# add the application
ADD src/bitcoin-wallet /bitcoin-wallet
ADD src/auth-npm /auth-npm
ADD src/logger-npm /logger-npm
ADD src/player-interface-node /player-interface-node
ADD src/backoffice-node /backoffice-node

RUN sed -i '/git+ssh:/d' /backoffice-node/package.json
RUN cd /backoffice-node && cat package.json && npm install ../bitcoin-wallet
RUN cd /backoffice-node && npm install ../auth-npm
RUN cd /backoffice-node && npm install ../logger-npm
RUN cd /backoffice-node && npm install ../player-interface-node

RUN chown -R app:app /backoffice-node

EXPOSE 8443

CMD ["--"]

