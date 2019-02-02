#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libvpx
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_THREADED_OPTIONS \
  -s TOTAL_MEMORY=33554432 \
  -s EXPORT_NAME="'OGVDecoderVideoVP9MT'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js-mt/root/include \
  -Lbuild/js-mt/root/lib \
  build/js-mt/root/lib/libvpx.so \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -o build/ogv-decoder-video-vp9-mt.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_THREADED_OPTIONS \
  -s TOTAL_MEMORY=33554432 \
  -s EXPORT_NAME="'OGVDecoderVideoVP9MTW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libvpx.so \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -o build/ogv-decoder-video-vp9-mt-wasm.js
