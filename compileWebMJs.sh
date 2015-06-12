#!/bin/bash

# note the libvpx build system wants to make .so even on Mac

# compile wrapper around libnestegg + libvpx + libogg + libvorbis
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
  -lnestegg \
  -lvpx \
  --js-library src/codec-libs-mixin.js \
  src/webm-libs.c \
  -o build/js/webm-libs.js
