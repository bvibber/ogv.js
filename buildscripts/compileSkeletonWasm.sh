#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p libskeleton
cd libskeleton
  
# finally, run configuration script
emconfigure ../../../libskeleton/configure \
	--prefix="$dir/build/wasm/root" \
	PKG_CONFIG_PATH="$dir/build/wasm/root/lib/pkgconfig" \
	--disable-shared \
    CFLAGS="-O3 -msimd128"

# compile libskeleton
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
