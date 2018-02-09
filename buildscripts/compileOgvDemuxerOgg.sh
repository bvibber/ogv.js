#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + liboggz + libskeleton
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerOgg'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/liboggz.$suffix \
  build/js/root/lib/libskeleton.$suffix \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-ogg.c \
  src/c/ogv-buffer-queue.c \
  -o build/ogv-demuxer-ogg.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerOggW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/liboggz.$suffix \
  build/js/root/lib/libskeleton.$suffix \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-ogg.c \
  src/c/ogv-buffer-queue.c \
  -o build/ogv-demuxer-ogg-wasm.js
