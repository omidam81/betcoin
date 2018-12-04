FROM docker.betcoin.tm/baseimage
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /prize-node
RUN mkdir /bitcoin-wallet

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/prize-node/package.json /prize-node/
ADD src/bitcoin-wallet/package.json /bitcoin-wallet/

RUN sed -i '/git+ssh:/d' /prize-node/package.json
# install node modules
RUN cd /prize-node && npm install
RUN cd /bitcoin-wallet && npm install

# add the application
ADD src/bitcoin-wallet /bitcoin-wallet
ADD src/prize-node /prize-node

RUN mkdir /etc/service/prize-node
ONBUILD ADD runit/prize-node.sh /etc/service/prize-node/run
