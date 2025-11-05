#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p libnestegg
cd libnestegg

# finally, run configuration script
EMCONFIGURE_JS=2 NM=/usr/bin/nm emconfigure \
    ../../../libnestegg/configure \
    --prefix="$dir/build/wasm/root" \
    --disable-shared \
    CFLAGS="-O3 -msimd128"

# compile libnestegg
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
