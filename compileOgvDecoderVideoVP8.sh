#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi
# note the libvpx build system wants to make .so even on Mac

# compile wrapper around libogg + libtheora
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s NO_BROWSER=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s TOTAL_MEMORY=33554432 \
  -s EXPORT_NAME="'OGVDecoderVideoVP8'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvpx.so \
  --js-library src/ogv-decoder-video-callbacks.js \
  --pre-js src/ogv-module-pre.js \
  --post-js src/ogv-decoder-video.js \
  src/ogv-decoder-video-vp8.c \
  src/ogv-ogg-support.c \
  -o build/ogv-decoder-video-vp8.js
