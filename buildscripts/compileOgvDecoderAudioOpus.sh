#!/bin/bash
set -e

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libopus
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderAudioOpus'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/wasm/root/include \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-opus.c \
  src/c/ogv-ogg-support.c \
  src/c/opus_header.c \
  src/c/opus_helper.c \
  -Lbuild/wasm/root/lib \
  -lopus \
  -logg \
  -o build/ogv-decoder-audio-opus.js \
