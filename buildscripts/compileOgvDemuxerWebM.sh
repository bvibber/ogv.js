#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libnestegg
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerWebM'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libnestegg.$suffix \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-webm.c \
  src/c/ogv-buffer-queue.c \
  -o build/ogv-demuxer-webm.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerWebMW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libnestegg.$suffix \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-webm.c \
  src/c/ogv-buffer-queue.c \
  -o build/ogv-demuxer-webm-wasm.js
