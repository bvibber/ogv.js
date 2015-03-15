#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

# compile wrapper around libogg + libvorbis + libtheora
EMCC_FAST_COMPILER=1 em++ \
  -O3 \
  --bind \
  --profiling \
  --std=c++11 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s NO_BROWSER=1 \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  -IOGVCore/include \
  -IOGVCore/src \
  -Isrc \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvorbis.$suffix \
  build/js/root/lib/libopus.$suffix \
  build/js/root/lib/libtheoradec.$suffix \
  build/js/root/lib/libskeleton.$suffix \
  -D OPUS \
  -D SKELETON \
  src/opus_header.c \
  src/opus_helper.c \
  OGVCore/src/OGVCore/Decoder.cpp \
  OGVCore/src/OGVCore/Player.cpp \
  src/OGVCore-bindings.cpp \
  -o build/js/OGVCore.js
