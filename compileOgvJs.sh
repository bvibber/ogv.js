#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
# Warning: -O2 enables the emscripten relooper which, on current release version hangs
# on arm64 iOS devices in Vorbis decoding. Use with emscripten-fastcomp for iOS arm64!
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s WARN_ON_UNDEFINED_SYMBOLS=1 \
  -s EXPORTED_FUNCTIONS="['_OgvJsInit', '_OgvJsDestroy', '_OgvJsReceiveInput', '_OgvJsProcess', '_OgvJsDecodeFrame', '_OgvJsDecodeAudio']" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  -logg \
  build/js/libogg/src/bitwise.o \
  -lvorbis \
  -ltheoradec \
  --js-library src/ogv-libs-mixin.js \
  src/ogv-libs.c \
  -o build/js/ogv-libs.js
