#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p libogg
cd libogg

# finally, run configuration script
emconfigure ../../../libogg/configure \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
|| exit 1

# compile libogg
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
