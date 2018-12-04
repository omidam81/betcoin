FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /cache-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/cache-node/package.json /cache-node/

# install node modules
RUN cd /cache-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/cache-node
ADD runit/cache-node.sh /etc/service/cache-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/cache-node.log

# add the application
ADD src/cache-node /cache-node

RUN chown -R app:app /cache-node

EXPOSE 8443

CMD ["--"]

