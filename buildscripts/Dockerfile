FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive
SHELL ["/bin/bash", "-c"]
RUN apt-get update && apt-get install -y --no-install-recommends autoconf && apt-get install -y --no-install-recommends automake && apt-get install -y --no-install-recommends libtool && apt-get install -y --no-install-recommends pkg-config && apt-get install -y --no-install-recommends lld && apt-get install -y --no-install-recommends clang && update-alternatives --install /usr/bin/wasm-ld wasm-ld /usr/bin/wasm-ld-10 100 && apt-get install -y --no-install-recommends zip && apt-get install -y --no-install-recommends python3 && apt-get install -y --no-install-recommends python3-pip && apt-get install -y --no-install-recommends ninja-build && pip3 install meson && apt-get install -y --no-install-recommends curl && curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y --no-install-recommends nodejs && apt-get install -y --no-install-recommends git && apt-get install -y --no-install-recommends xz-utils && apt-get install -y --no-install-recommends make && rm -rf /var/lib/apt/lists/* && cd ~ && git clone https://github.com/emscripten-core/emsdk.git && cd emsdk && git pull && ./emsdk install 1.39.16 && ./emsdk activate 1.39.16 && source ./emsdk_env.sh
ENV PATH="/root/emsdk:/root/emsdk/upstream/emscripten:/root/emsdk/node/12.9.1_64bit/bin:${PATH}"
ENV EMSDK=/root/emsdk
ENV EM_CONFIG=/root/emsdk/.emscripten
ENV EM_CACHE=/root/emsdk/upstream/emscripten/cache
ENV EMSDK_NODE=/root/emsdk/node/12.9.1_64bit/bin/node
CMD /bin/bash
# check it on https://www.fromlatest.io/#/