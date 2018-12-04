FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /circle-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/circle-node/package.json /circle-node/

RUN sed -i '/git+ssh:/d' /circle-node/package.json
# install node modules
RUN cd /circle-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/circle-node
ADD runit/circle-node.sh /etc/service/circle-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/circle-node.log

CMD ["--"]

# add the application
ADD src/circle-node /circle-node
ADD src/player-interface-node /player-interface-node

RUN cd /circle-node && npm install ../player-interface-node
RUN chown -R app:app /circle-node

EXPOSE 8443

