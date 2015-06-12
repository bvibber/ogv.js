#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s NO_BROWSER=1 \
  -s EXPORTED_FUNCTIONS="`< src/codec-libs-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  -logg \
  -lvorbis \
  -lopus \
  -ltheoradec \
  -lskeleton \
  --js-library src/codec-libs-mixin.js \
  -D OPUS \
  -D SKELETON \
  src/opus_header.c \
  src/opus_helper.c \
  src/ogv-libs.c \
  -o build/js/ogv-libs.js
