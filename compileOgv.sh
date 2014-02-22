#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
PATH=$HOME/crossbridge/sdk/usr/bin:$PATH gcc \
  -O2 \
  -emit-swf \
  -flto-api=swfexports.txt \
  -I libogg/include -Llibogg/src/.libs -logg \
  libogg/src/bitwise.o \
  -I libvorbis/include -Llibvorbis/lib/.libs -lvorbis \
  -I libtheora/include -Llibtheora/lib/.libs -ltheoradec \
  src/ogv-libs.c \
  -o ogv-libs.swf && \
mv ogv-libs.swf build/intermediate/ogv-libs.swf

