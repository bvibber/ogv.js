#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libtheora
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoTheora'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-theora.c \
  src/c/ogv-ogg-support.c \
  -Lbuild/js/root/lib \
  -logg \
  -ltheora \
  -o build/ogv-decoder-video-theora.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoTheoraW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-theora.c \
  src/c/ogv-ogg-support.c \
  -Lbuild/js/root/lib \
  -ltheora \
  -logg \
  -o build/ogv-decoder-video-theora-wasm.js
