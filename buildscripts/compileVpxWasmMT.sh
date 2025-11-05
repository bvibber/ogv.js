#!/bin/bash
set -e

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm-mt
cd wasm-mt

mkdir -p root
mkdir -p libvpx
cd libvpx

#

# finally, run configuration script
EMCONFIGURE_JS=1 \
STRIP=./buildscripts/fake-strip.sh \
LDFLAGS=-pthread \
  emconfigure ../../../libvpx/configure \
    --prefix="$dir/build/wasm-mt/root" \
    --target=generic-gnu \
    --extra-cflags='-pthread -s USE_PTHREADS=1 -O3 -msimd128 -I'`dirname \`which emcc\``'/system/lib/libcxxabi/include/' \
    --enable-multithread \
    --enable-vp9-decoder \
    --disable-vp8-encoder \
    --disable-vp9-encoder \
    --disable-shared \
    --disable-docs \
    --disable-examples \
    --disable-tools \
    --disable-unit-tests

# compile libvpx
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
