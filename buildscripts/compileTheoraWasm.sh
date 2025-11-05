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
    CFLAGS="-O3 -msimd128"

# compile libtheora
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
