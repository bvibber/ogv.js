#!/bin/bash

. ./buildscripts/compile-options.sh

# compile wrapper around libogg + libopus
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_ASMJS_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderAudioOpus'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-opus.c \
  src/c/ogv-ogg-support.c \
  src/c/opus_header.c \
  src/c/opus_helper.c \
  -Lbuild/js/root/lib \
  -lopus \
  -logg \
  -o build/ogv-decoder-audio-opus.js \
&& \
node buildscripts/strip-imul.js build/ogv-decoder-audio-opus.js \
&& \
emcc \
  $EMCC_COMMON_OPTIONS \
  $EMCC_WASM_OPTIONS \
  $EMCC_NOTHREAD_OPTIONS \
  -s EXPORT_NAME="'OGVDecoderAudioOpusW'" \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-opus.c \
  src/c/ogv-ogg-support.c \
  src/c/opus_header.c \
  src/c/opus_helper.c \
  -Lbuild/js/root/lib \
  -lopus \
  -logg \
  -o build/ogv-decoder-audio-opus-wasm.js \
