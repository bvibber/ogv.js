#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

# compile wrapper around libogg + libvorbis + libtheora
# Warning: -O2 enables the emscripten relooper which, on current release version hangs
# on arm64 iOS devices in Vorbis decoding. Use with emscripten-fastcomp for iOS arm64!
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s EXPORTED_FUNCTIONS="['_OgvJsInit', '_OgvJsDestroy', '_OgvJsReceiveInput', '_OgvJsProcess', '_OgvJsDecodeFrame', '_OgvJsDecodeAudio']" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvorbis.$suffix \
  build/js/root/lib/libopus.$suffix \
  build/js/root/lib/libtheoradec.$suffix \
  --js-library src/ogv-libs-mixin.js \
  -D OPUS \
  src/opus_header.c \
  src/opus_helper.c \
  src/ogv-libs.c \
  -o build/js/ogv-libs.js
