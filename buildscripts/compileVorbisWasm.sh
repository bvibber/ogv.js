#!/bin/bash

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
export EMCC_WASM_BACKEND=1
emconfigure ../../../libvorbis/configure \
    --disable-oggtest \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
|| exit 1

# compile libvorbis
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
