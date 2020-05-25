FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y autoconf && apt-get install -y automake && apt-get install -y libtool && apt-get install -y pkg-config && apt-get install -y python3 && apt-get install -y python3-pip && apt-get install -y ninja-build && pip3 install meson && apt-get install -y curl && curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs
CMD /bin/bash
