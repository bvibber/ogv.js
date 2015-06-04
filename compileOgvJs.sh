#!/bin/bash

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

# compile wrapper around libogg + libvorbis + libtheora
EMCC_FAST_COMPILER=1 emcc \
  -O2 \
  --memory-init-file 0 \
  -s ASM_JS=1 \
  -s VERBOSE=1 \
  -s ERROR_ON_UNDEFINED_SYMBOLS=1 \
  -s NO_FILESYSTEM=1 \
  -s NO_BROWSER=1 \
  -s EXPORTED_FUNCTIONS="['_codecjs_init', '_codecjs_destroy', '_codecjs_receive_input', '_codecjs_process', '_codecjs_decode_frame', '_codecjs_decode_audio', '_codecjs_flush_buffers', '_codecjs_discard_frame', '_codecjs_discard_audio', '_codecjs_media_length', '_codecjs_media_duration', '_codecjs_keypoint_offset']" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  build/js/root/lib/libogg.$suffix \
  build/js/root/lib/libvorbis.$suffix \
  build/js/root/lib/libopus.$suffix \
  build/js/root/lib/libtheoradec.$suffix \
  build/js/root/lib/libskeleton.$suffix \
  --js-library src/ogv-libs-mixin.js \
  -D OPUS \
  -D SKELETON \
  src/opus_header.c \
  src/opus_helper.c \
  src/ogv-libs.c \
  -o build/js/ogv-libs.js
