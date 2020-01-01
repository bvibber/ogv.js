#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libvorbis
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_SWF_OPTIONS \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  src/c/ogv-decoder-audio-vorbis.c \
  src/c/ogv-ogg-support.c \
  -Lbuild/js/root/lib \
  -lvorbis \
  -logg \
  -o build/ogv-decoder-audio-vorbis-swf.wasm && \
$WASM2SWF \
  $WASM2SWF_OPTIONS \
  -o build/ogv-decoder-audio-vorbis.swf \
  build/ogv-decoder-audio-vorbis-swf.wasm
