#!/bin/bash

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
export EMCC_WASM_BACKEND=1
emconfigure ../../../libogg/configure \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
    CFLAGS="-s WASM_OBJECT_FILES=0" \
|| exit 1

# compile libogg
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
