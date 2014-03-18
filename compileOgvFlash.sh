#!/bin/bash

export PATH="$HOME/crossbridge/sdk/usr/bin:$PATH"

# compile wrapper around libogg + libvorbis + libtheora
gcc \
  -O2 \
  -emit-swc=com.brionv.ogvlibs \
  -Ibuild/flash/root/include \
  -Lbuild/flash/root/lib \
  -logg \
  build/flash/libogg/src/bitwise.o \
  -lvorbis \
  -ltheoradec \
  src/ogv-libs.c \
  src/ogv-libs-mixin-flash.c \
  src/YCbCr.c \
  build/flash/root/lib/libogg.a \
  build/flash/root/lib/libvorbis.a \
  build/flash/root/lib/libtheoradec.a \
  -o build/flash/ogv-libs.swc
