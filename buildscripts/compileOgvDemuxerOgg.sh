#!/bin/bash
set -e

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + liboggz + libskeleton
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDemuxerOgg'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-demuxer-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-demuxer-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-demuxer.js \
  src/c/ogv-demuxer-ogg.c \
  src/c/ogv-buffer-queue.c \
  -Lbuild/wasm/root/lib \
  -lskeleton \
  -loggz \
  -logg \
  -o build/ogv-demuxer-ogg.js
