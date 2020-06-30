#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libdav1d
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_THREADED_OPTIONS \
  -msimd128 \
  -s EXPORT_NAME="'OGVDecoderVideoAV1SIMDMTW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm-simd-mt/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-av1.c \
  -Lbuild/wasm-simd-mt/root/lib \
  -ldav1d \
  -o build/ogv-decoder-video-av1-simd-mt-wasm.js
