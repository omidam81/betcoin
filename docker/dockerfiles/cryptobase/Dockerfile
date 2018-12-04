FROM docker.betcoin.tm/baseimage:0.2.0
MAINTAINER atticus

ENV HOME /root

RUN apt-get install -y build-essential git

# make a user to run the app as
RUN groupadd -g 1042 app
RUN useradd -m -u 1042 -g 1042 app

# add a bitbucket deployment key (read only) and add the bitbucket sig
# to known hosts
ADD key /root/.ssh/id_rsa
ADD key.pub /root/.ssh/id_rsa.pub
RUN echo 'bitbucket.org,131.103.20.168 ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAubiN81eDcafrgMeLzaFPsw2kNvEcqTKl/VqLat/MaB33pZy0y3rJZtnqwR2qOOvbwKZYKiEO1O6VqNEBxKvJJelCq0dTXWT5pbO2gDXC6h6QDXCaHo6pOHGPUy+YBaGQRGuSusMEASYiWunYN0vCAI8QaXnWMXNMdFP3jHAJH0eDsoiGnLPBlBp4TNm6rYI74nMzgz3B9IikW4WVK+dc8KZJZWYjAuORU3jc1c/NPskD2ASinf8v3xnfXeukU0sJ5N6m5E8VLjObPEO+mN2t/FZTMZLiFqPWc/ALSqnMnnhwrNi2rbfg/rd/IpL8Le3pSBne8+seeFVBoGqzHM9yXw==' > /root/.ssh/known_hosts

RUN mkdir /app

