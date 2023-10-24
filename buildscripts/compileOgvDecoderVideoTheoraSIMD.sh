#!/bin/bash
set -e

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libtheora
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -msimd128 \
  -s EXPORT_NAME="'OGVDecoderVideoTheoraSIMD'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm-simd/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  src/c/ogv-decoder-video-theora.c \
  src/c/ogv-ogg-support.c \
  -Lbuild/wasm-simd/root/lib \
  -ltheora \
  -logg \
  -o build/ogv-decoder-video-theora-simd.js
