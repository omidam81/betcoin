FROM docker.betcoin.tm/baseimage
MAINTAINER atticus

ENV HOME /root

# install deps
RUN apt-get update && apt-get -y install wget python-setuptools build-essential python-dev && \
easy_install pymongo

# get and decompress monitoring agent
RUN curl -OL https://mms.mongodb.com/download/agent/monitoring/mongodb-mms-monitoring-agent-2.1.0.35-1.linux_x86_64.tar.gz && \
tar xzvf mongodb-mms-monitoring-agent-2.1.0.35-1.linux_x86_64.tar.gz && \
sed -i 's/mmsApiKey=/mmsApiKey=4515f8525d1cb1f12e7a1bc1f65aee6a/' /mongodb-mms-monitoring-agent-2.1.0.35-1.linux_x86_64/monitoring-agent.config

RUN curl -OL https://mms.mongodb.com/download/agent/backup/mongodb-mms-backup-agent-1.4.4.34-1.linux_x86_64.tar.gz && \
tar xzvf mongodb-mms-backup-agent-1.4.4.34-1.linux_x86_64.tar.gz && \
sed -i 's/apiKey=/apiKey=4515f8525d1cb1f12e7a1bc1f65aee6a/' /mongodb-mms-backup-agent-1.4.4.34-1.linux_x86_64/local.config

# build the service file
RUN mkdir /etc/service/mms-agent && \
echo "#!/usr/bin/env bash" > /etc/service/mms-agent/run && \
echo "cd /mongodb-mms-monitoring-agent-2.1.0.35-1.linux_x86_64 && exec nohup ./mongodb-mms-monitoring-agent >> /var/log/mms-agent.log 2>&1" >> /etc/service/mms-agent/run && \
chmod +x /etc/service/mms-agent/run;

RUN mkdir /etc/service/backup-agent && \
echo "#!/usr/bin/env bash" > /etc/service/backup-agent/run && \
echo "cd /mongodb-mms-backup-agent-1.4.4.34-1.linux_x86_64 && exec nohup ./mongodb-mms-backup-agent >> /var/log/mms-agent.log 2>&1" >> /etc/service/backup-agent/run && \
chmod +x /etc/service/backup-agent/run;

RUN touch /var/log/mms-agent.log

CMD ["--", "tailf", "/var/log/mms-agent.log"]
