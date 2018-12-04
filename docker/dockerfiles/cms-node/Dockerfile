FROM docker.betcoin.tm/baseimage:0.1.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential

# make a user to run the app as (default to user 1000, since that
# will be the most common uid of the user running this)
RUN groupadd -g 1000 app
RUN useradd -m -u 1000 -g 1000 app

RUN mkdir /cms-node

# add package.json fisrt, si this will install modules only when the
# package.json has changed
ADD src/cms-node/package.json /cms-node/

RUN sed -i '/git+ssh:/d' /cms-node/package.json
# install node modules
RUN cd /cms-node && npm install

# setup daemons in runit
RUN mkdir /etc/service/cms-node
ADD runit/cms-node.sh /etc/service/cms-node/run

# touch the logfile so we have something to tail by default
RUN touch /var/log/cms-node.log

CMD ["--", "tailf", "/var/log/cms-node.log"]

# add the application
ADD src/cms-node /cms-node
ADD src/auth-npm /auth-npm

RUN cd /cms-node && npm install ../auth-npm
RUN chown -R app:app /cms-node

EXPOSE 8443

