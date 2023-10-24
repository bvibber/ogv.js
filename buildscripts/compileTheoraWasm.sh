#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p libtheora
cd libtheora

# finally, run configuration script
emconfigure ../../../libtheora/configure \
    --disable-oggtest \
    --prefix="$dir/build/wasm/root" \
    --with-ogg="$dir/build/wasm/root" \
    --disable-asm \
    --disable-examples \
    --disable-encode \
    --disable-shared \
|| exit 1

# compile libtheora
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
