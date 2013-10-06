#!/bin/bash

# compile wrapper around libogg + libvorbis + libtheora
emcc \
  -O2 \
  -s ASM_JS=1 \
  -s EXPORTED_FUNCTIONS="['_OgvJsInit', '_OgvJsDestroy']" \
  -I libtheora/include -Llibtheora/lib/.libs -ltheora \
  -I libvorbis/include -Llibvorbis/src/.libs -lvorbis \
  -I libogg/include -Llibogg/src/.libs -logg \
  src/ogv-libs.c -o build/ogv-libs.js
