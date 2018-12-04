FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /support-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/support-node/package.json /support-node/

RUN sed -i '/git+ssh:/d' /support-node/package.json
# install node modules
RUN cd /support-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/support-node
ADD runit/support-node.sh /etc/service/support-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/support-node.log

CMD ["--"]

# add the application
ADD src/support-node /support-node
ADD src/auth-npm /auth-npm

RUN cd /support-node && npm install ../auth-npm
RUN chown -R app:app /support-node

EXPOSE 8443

