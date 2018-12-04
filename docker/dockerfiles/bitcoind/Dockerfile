FROM docker.betcoin.tm/baseimage:0.2.0
MAINTAINER atticus

ENV HOME /root

# install bitcoind
RUN add-apt-repository ppa:bitcoin/bitcoin
RUN apt-get update
RUN apt-get install -y bitcoind build-essential

# make a user to run bitcoind as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1001 bitcoind
RUN useradd -m -u 1001 -g 1001 bitcoind

# setup daemons in runit
RUN mkdir /etc/service/bitcoind /etc/service/bitcoin-wallet
ADD runit/bitcoind.sh /etc/service/bitcoind/run
ADD runit/bitcoin-wallet.sh /etc/service/bitcoin-wallet/run

RUN mkdir /bitcoin-wallet

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/bitcoin-wallet/package.json /bitcoin-wallet/

# install node modules
RUN cd /bitcoin-wallet && npm install

# add the application
ADD src/bitcoin-wallet /bitcoin-wallet

RUN chown -R bitcoind:bitcoind /bitcoin-wallet

# expose the socket server, P2P port, and RPC port (the P2P port
# **must** be exposed on the host machine with **the same port**, see
# the documentation about running multiple instances on the same host)
EXPOSE 1337 8333 8332

# you must mount a bitcoind data directory
VOLUME ["/home/bitcoind/.bitcoin"]

# make the app verbose
RUN echo 'module.exports.consoleLevel = "silly"' > /bitcoin-wallet/config/logs.local.js

# touch the logfile so we have something to tail by default
RUN touch /var/log/bitcoin-wallet.log

CMD ["--"]
