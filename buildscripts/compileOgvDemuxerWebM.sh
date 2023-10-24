#!/bin/bash
set -e

. ./buildscripts/compile-options.sh

# compile wrapper around libnestegg
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerWebM'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-webm.c \
  src/c/ogv-buffer-queue.c \
  -Lbuild/wasm/root/lib \
  -lnestegg \
  -o build/ogv-demuxer-webm.js
