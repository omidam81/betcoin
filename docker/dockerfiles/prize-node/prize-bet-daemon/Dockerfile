FROM docker.betcoin.tm/prize-base
MAINTAINER atticus

# touch the logfile so we have something to tail by default
RUN touch /var/log/prize-node.log

CMD ["--", "tailf", "/var/log/prize-node.log"]

