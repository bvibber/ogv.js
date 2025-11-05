#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root/bin
mkdir -p root/lib
mkdir -p root/include
mkdir -p liboggz
cd liboggz

# finally, run configuration script
emconfigure ../../../liboggz/configure \
    --prefix="$dir/build/wasm/root" \
    --disable-write \
    --disable-shared \
    CFLAGS="-O3 -msimd128"

# compile liboggz
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
