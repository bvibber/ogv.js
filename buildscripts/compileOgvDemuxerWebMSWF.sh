#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libnestegg
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  src/c/ogv-demuxer-webm.c \
  src/c/ogv-buffer-queue.c \
  -Lbuild/js/root/lib \
  -lnestegg \
  -o build/ogv-demuxer-webm-swf.js && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-demuxer-webm.swf \
  build/ogv-demuxer-webm-swf.wasm
