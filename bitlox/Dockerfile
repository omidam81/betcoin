FROM ubuntu:14.04

RUN apt-get update && apt-get install -y php5 php5-mysql php5-mcrypt php5-curl php5-json php5-gd apache2 libapache2-mod-php5 unzip

# Manually set up the apache environment variables
ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data
ENV APACHE_LOG_DIR /var/log/apache2
ENV APACHE_LOCK_DIR /var/lock/apache2
ENV APACHE_PID_FILE /var/run/apache2.pid

RUN a2enmod rewrite
RUN php5enmod mcrypt

ADD ./zips /zips/

RUN rm -f /var/www/html/index.html; cd /tmp; \
unzip /zips/prestashop_1.6.0.11.zip && mv prestashop/* /var/www/html; \
unzip /zips/bitpay-prestashop-plugin-v1.5-2-gdd919f3.zip && mv bitpay-prestashop-plugin-dd919f3/modules/bitpay /var/www/html/modules/; \
unzip /zips/gocoin-prestashop-1.3.1.zip && mv gocoin-prestashop-1.3.1/gocoinpay/ /var/www/html/modules/ && mv gocoin-prestashop-1.3.1/gocoinlib/ /var/www/html/classes/; \
chown -R www-data:www-data /var/www;

ADD php.ini /etc/php5/apache2/conf.d/7-prestashop.ini
# ADD apache-config.conf /etc/apache2/sites-enabled/000-default.conf



EXPOSE 80

CMD /bin/chown www-data:www-data /var/www/html/config/settings.inc.php && /usr/sbin/apache2ctl -D FOREGROUND
