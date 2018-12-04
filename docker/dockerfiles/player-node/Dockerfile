FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /player-node
RUN mkdir /bitcoin-wallet

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/player-node/package.json /player-node/
RUN sed -i '/git+ssh:/d' /player-node/package.json
ADD src/bitcoin-wallet/package.json /bitcoin-wallet/

# install node modules
RUN cd /player-node && npm install
RUN cd /bitcoin-wallet && npm install

# setup daemons in runit
RUN mkdir /etc/service/player-node
ADD runit/player-node.sh /etc/service/player-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/player-node.log

CMD ["--"]

# add the application
ADD src/bitcoin-wallet /bitcoin-wallet
ADD src/player-node /player-node
ADD src/auth-npm /auth-npm
ADD src/logger-npm /logger-npm

RUN cd /player-node && npm install ../auth-npm
RUN cd /player-node && npm install ../logger-npm
RUN chown -R app:app /player-node /bitcoin-wallet

EXPOSE 8443

