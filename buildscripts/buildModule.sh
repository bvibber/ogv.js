#!/bin/bash

moduleType="$1"
moduleName="$2"
exportName="$3"
libs="$4"
files="$5"
# buildModule.sh decoder-video theora OGVDecoderVideoTheora 'ogg theora' 'ogg-support.c'

suffix=so
if [ `uname -s` == "Darwin" ]; then
	suffix=dylib
fi

libList=""
for lib in "$libs"
do
	libList="$libList build/js/root/lib$lib.$suffix"
done

fileList=""
for file in "ogv-$moduleType-$moduleName.c $files"
do
	fileList="$fileList src/c/$file"
done

# compile wrapper around libogg + libtheora
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
  -s TOTAL_MEMORY=33554432 \
  -s EXPORT_NAME="'$exportName'" \
  -s MODULARIZE=1 \
  -s EXPORTED_FUNCTIONS="`< src/js/modules/ogv-$moduleType-exports.json`" \
  -Ibuild/js/root/include \
  -Lbuild/js/root/lib \
  $libList \
  --js-library src/js/modules/ogv-$moduleType-callbacks.js \
  --pre-js src/js/modules/ogv-module-pre.js \
  --post-js src/js/modules/ogv-$moduleType.js \
  $fileList \
  -o build/ogv-$moduleType-$moduleName.js
