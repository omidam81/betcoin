FROM phusion/baseimage:0.9.12
MAINTAINER atticus

ENV HOME /root

# disable sshd
RUN rm -rf /etc/service/sshd /etc/my_init.d/00_regen_ssh_host_keys.sh /root/.ssh/authorized_keys

RUN apt-get update --fix-missing
# install python utils for ppa management
RUN apt-get -y install python-software-properties

# add node js
RUN add-apt-repository -y ppa:chris-lea/node.js

# update the system and install stuff
RUN apt-get update --fix-missing
RUN apt-get -y upgrade
RUN apt-get -y install nodejs python3

ENTRYPOINT ["/sbin/my_init"]

CMD ["--"]
