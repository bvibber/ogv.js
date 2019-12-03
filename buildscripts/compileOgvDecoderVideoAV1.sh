#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libdav1d
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoAV1'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-av1.c \
  -Lbuild/js/root/lib \
  -ldav1d \
  -o build/ogv-decoder-video-av1.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoAV1W'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-av1.c \
  -Lbuild/wasm/root/lib \
  -ldav1d \
  -o build/ogv-decoder-video-av1-wasm.js
