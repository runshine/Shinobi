#ARG BASE_IMAGE=node:lts-slim
ARG BASE_IMAGE=sitespeedio/node:ubuntu-22-04-nodejs-20.10.0
FROM ${BASE_IMAGE}
    
ARG DEBIAN_FRONTEND=noninteractive \
    EXCLUDE_DB=false \
    FFMPEG_VERSION=ffmpeg-6.0-linux-amd64

ENV DB_USER=majesticflame \
    DB_PASSWORD='' \
    DB_HOST='localhost' \
    DB_DATABASE=ccio \
    DB_PORT=3306 \
    DB_TYPE='mysql' \
    SUBSCRIPTION_ID=sub_XXXXXXXXXXXX \
    PLUGIN_KEYS='{}' \
    SSL_ENABLED='false' \
    SSL_COUNTRY='CA' \
    SSL_STATE='BC' \
    SSL_LOCATION='Vancouver' \
    SSL_ORGANIZATION='Shinobi Systems' \
    SSL_ORGANIZATION_UNIT='IT Department' \
    SSL_COMMON_NAME='nvr.ninja' \
    DB_DISABLE_INCLUDED=$EXCLUDE_DB

WORKDIR /home/Shinobi
COPY . ./

RUN apt-get update -y
RUN apt-get upgrade -y

RUN apt-get install -y \
        wget \
        curl \
        net-tools \
        software-properties-common \
        build-essential \
        git \
        python3 \
        sudo \
        pkg-config \
        apt-utils \
        yasm \
        bzip2 \
        coreutils \
        procps \
        gnutls-bin \
        nasm \
        tar \
        make \
        g++ \
        gcc \
        tar \
        xz-utils \
	tzdata

RUN sh /home/Shinobi/Docker/install_ffmpeg.sh
RUN sh /home/Shinobi/Docker/install_mariadb.sh
RUN sh /home/Shinobi/Docker/install_nodejs.sh

#RUN cd /opt && wget https://github.com/AkashiSN/ffmpeg-docker/releases/download/v2.3.1/$FFMPEG_VERSION.tar.xz && xz -d $FFMPEG_VERSION.tar.xz && tar -xvf $FFMPEG_VERSION.tar && mv $FFMPEG_VERSION ffmpeg && rm $FFMPEG_VERSION.tar

#RUN sed -i '$i\/opt/ffmpeg/lib' /etc/ld.so.conf.d/x86_64-linux-gnu.conf && ldconfig && rm /usr/bin/ffmpeg && ln -s /opt/ffmpeg/bin/ffmpeg /usr/bin/ffmpeg

RUN chmod 777 /home/Shinobi
RUN chmod -R 777 /home/Shinobi/plugins
RUN chmod -f +x /home/Shinobi/Docker/init.sh

RUN sed -i -e 's/\r//g' /home/Shinobi/Docker/init.sh

RUN apt-get update -y --fix-missing
RUN apt-get upgrade -y

VOLUME ["/home/Shinobi/videos"]
VOLUME ["/home/Shinobi/libs/customAutoLoad"]
VOLUME ["/config"]

EXPOSE 8080 443 21 25

ENTRYPOINT ["/home/Shinobi/Docker/init.sh"]

CMD [ "pm2-docker", "/home/Shinobi/Docker/pm2.yml" ]
