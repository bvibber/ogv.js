#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libdav1d
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  src/c/ogv-decoder-video-av1.c \
  -Lbuild/wasm/root/lib \
  -ldav1d \
  -o build/ogv-decoder-video-av1-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-decoder-video-av1.swf \
  build/ogv-decoder-video-av1-swf.wasm
