#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

# compile wrapper around libogg + libvorbis
EMCC_FAST_COMPILER=1 emcc \
  -O3 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s NODEJS_CATCH_EXIT=0 \
  -s LEGACY_VM_SUPPORT=1 \
  -s EXPORT_NAME="'OGVDecoderAudioVorbis'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvorbis.$suffix \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-vorbis.c \
  src/c/ogv-ogg-support.c \
  -o build/ogv-decoder-audio-vorbis.js \
&& \
EMCC_FAST_COMPILER=1 emcc \
  -O3 \
  --memory-init-file 0 \
  -s WASM=1 \
  -s BINARYEN_METHOD="'native-wasm'" \
  -s BINARYEN_IGNORE_IMPLICIT_TRAPS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s INVOKE_RUN=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s NODEJS_CATCH_EXIT=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORT_NAME="'OGVDecoderAudioVorbisW'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-decoder-audio-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvorbis.$suffix \
  --js-library src/js/modules/ogv-decoder-audio-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-decoder-audio.js \
  src/c/ogv-decoder-audio-vorbis.c \
  src/c/ogv-ogg-support.c \
  -o build/ogv-decoder-audio-vorbis-wasm.js \
