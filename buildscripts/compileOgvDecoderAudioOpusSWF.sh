#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libopus
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  src/c/ogv-decoder-audio-opus.c \
  src/c/ogv-ogg-support.c \
  src/c/opus_header.c \
  src/c/opus_helper.c \
  -Lbuild/js/root/lib \
  -lopus \
  -logg \
  -o build/ogv-decoder-audio-opus-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-decoder-audio-opus.swf \
  build/ogv-decoder-audio-opus-swf.wasm
