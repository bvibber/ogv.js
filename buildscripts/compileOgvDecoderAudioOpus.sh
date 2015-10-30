#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

# compile wrapper around libogg + libopus
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s NO_BROWSER=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s EXPORT_NAME="'OGVDecoderAudioOpus'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libopus.$suffix \
  --js-library src/js/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/ogv-module-pre.js \
  --post-js src/js/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-opus.c \
  src/c/ogv-ogg-support.c \
  src/c/opus_header.c \
  src/c/opus_helper.c \
  -o build/ogv-decoder-audio-opus.js
