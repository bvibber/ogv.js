#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
emcc \
  -O2 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s WARN_ON_UNDEFINED_SYMBOLS=1 \
  -s EXPORTED_FUNCTIONS="['_OgvJsInit', '_OgvJsDestroy', '_OgvJsReceiveInput', '_OgvJsProcess']" \
  -I libogg/include -Llibogg/src/.libs -logg \
  libogg/src/bitwise.o \
  -I libvorbis/include -Llibvorbis/lib/.libs -lvorbis \
  -I libtheora/include -Llibtheora/lib/.libs -ltheora -ltheoradec \
  --js-library src/ogv-libs-mixin.js \
  src/ogv-libs.c -o build/ogv-libs.js
