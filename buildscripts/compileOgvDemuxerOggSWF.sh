#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + liboggz + libskeleton
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  src/c/ogv-demuxer-ogg.c \
  src/c/ogv-buffer-queue.c \
  -Lbuild/js/root/lib \
  -lskeleton \
  -loggz \
  -logg \
  -o build/ogv-demuxer-ogg-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-demuxer-ogg.swf \
  build/ogv-demuxer-ogg-swf.wasm
