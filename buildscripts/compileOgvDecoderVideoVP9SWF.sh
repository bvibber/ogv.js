#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libvpx
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -Lbuild/wasm/root/lib \
  -lvpx \
  -o build/ogv-decoder-video-vp9-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-decoder-video-vp9.swf \
  build/ogv-decoder-video-vp9-swf.wasm
