FROM docker.betcoin.tm/appbase
MAINTAINER atticus

# make a directory for the init script and touch the logfile
RUN mkdir /etc/service/app && touch /var/log/app.log
# add the init script
ADD runit/run /etc/service/app/

# expose the default app port (do not change, nginx proxy make the
# public port the correct one)
EXPOSE 8443

CMD ["--"]
