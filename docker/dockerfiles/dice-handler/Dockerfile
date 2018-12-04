FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /dice-handler-node
RUN mkdir /bitcoin-wallet

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/dice-handler-node/package.json /dice-handler-node/
ADD src/bitcoin-wallet/package.json /bitcoin-wallet/

RUN sed -i '/git+ssh:/d' /dice-handler-node/package.json
# install node modules
RUN cd /dice-handler-node && npm install
RUN cd /bitcoin-wallet && npm install

# setup daemons in runit
RUN mkdir /etc/service/dice-handler-node
ADD runit/dice-handler-node.sh /etc/service/dice-handler-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/dice-handler-node.log

# add the application
ADD src/bitcoin-wallet /bitcoin-wallet
ADD src/dice-handler-node /dice-handler-node

RUN chown -R app:app /dice-handler-node /bitcoin-wallet

EXPOSE 1338

CMD ["--"]

