#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p libvorbis
cd libvorbis
  
# finally, run configuration script
emconfigure ../../../libvorbis/configure \
    --disable-oggtest \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
    CFLAGS="-O3 -msimd128"

# compile libvorbis
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
