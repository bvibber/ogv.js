#!/bin/bash

# compile wrapper around libvpx
EMCC_FAST_COMPILER=1 emcc \
  -O3 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s TOTAL_MEMORY=33554432 \
  -s LEGACY_VM_SUPPORT=1 \
  -s EXPORT_NAME="'OGVDecoderVideoVP9'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libvpx.so \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -o build/ogv-decoder-video-vp9-imul.js \
&& \
node buildscripts/strip-imul.js \
  < build/ogv-decoder-video-vp9-imul.js \
  > build/ogv-decoder-video-vp9.js \
&& \
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s WASM=1 \
  -s BINARYEN_METHOD="'native-wasm'" \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s LEGACY_VM_SUPPORT=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORT_NAME="'OGVDecoderVideoVP9W'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-video-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libvpx.so \
  --js-library src/js/modules/ogv-decoder-video-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-video.js \
  -D OGV_VP9 \
  src/c/ogv-decoder-video-vpx.c \
  -o build/ogv-decoder-video-vp9-wasm.js
