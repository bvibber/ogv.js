#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libtheora
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  src/c/ogv-decoder-video-theora.c \
  src/c/ogv-ogg-support.c \
  -Lbuild/js/root/lib \
  -ltheora \
  -logg \
  -o build/ogv-decoder-video-theora-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-decoder-video-theora.swf \
  build/ogv-decoder-video-theora-swf.wasm
