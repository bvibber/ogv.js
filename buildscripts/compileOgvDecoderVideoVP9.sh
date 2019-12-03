#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libvpx
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoVP9'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -Lbuild/js/root/lib \
  -lvpx \
  -o build/ogv-decoder-video-vp9.js \
&& \
node buildscripts/strip-imul.js build/ogv-decoder-video-vp9.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderVideoVP9W'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -Lbuild/wasm/root/lib \
  -lvpx \
  -o build/ogv-decoder-video-vp9-wasm.js
