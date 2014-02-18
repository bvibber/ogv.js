#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
# Using -O1 instead of -O2 to avoid some sort of optimization fail that breaks Vorbis decoding on arm64 iOS 7 devices
emcc \
  -O1 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s WARN_ON_UNDEFINED_SYMBOLS=1 \
  -s EXPORTED_FUNCTIONS="['_OgvJsInit', '_OgvJsDestroy', '_OgvJsReceiveInput', '_OgvJsProcess']" \
  -I libogg/include -Llibogg/src/.libs -logg \
  libogg/src/bitwise.o \
  -I libvorbis/include -Llibvorbis/lib/.libs -lvorbis \
  -I libtheora/include -Llibtheora/lib/.libs -ltheoradec \
  --js-library src/ogv-libs-mixin.js \
  src/ogv-libs.c -o build/intermediate/ogv-libs.js
