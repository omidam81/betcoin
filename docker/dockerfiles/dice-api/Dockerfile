FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /dice-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/dice-node/package.json /dice-node/

RUN sed -i '/git+ssh:/d' /dice-node/package.json
# install node modules
RUN cd /dice-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/dice-node
ADD runit/dice-node.sh /etc/service/dice-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/dice-node.log

CMD ["--"]

# add the application
ADD src/dice-node /dice-node

RUN chown -R app:app /dice-node

EXPOSE 8443

