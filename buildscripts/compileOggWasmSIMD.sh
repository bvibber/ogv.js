#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm-simd
cd wasm-simd

mkdir -p root
mkdir -p libogg
cd libogg

# finally, run configuration script
emconfigure ../../../libogg/configure \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
    CFLAGS=-msimd128 \
|| exit 1

# compile libogg
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
