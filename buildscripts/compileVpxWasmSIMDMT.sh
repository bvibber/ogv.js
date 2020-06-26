#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm-simd-mt
cd wasm-simd-mt

mkdir -p root
mkdir -p libvpx
cd libvpx

#

# finally, run configuration script
EMCONFIGURE_JS=1 \
STRIP=./buildscripts/fake-strip.sh \
LDFLAGS=-pthread \
  emconfigure ../../../libvpx/configure \
    --prefix="$dir/build/wasm-simd-mt/root" \
    --target=generic-gnu \
    --extra-cflags=-pthread\ -s\ USE_PTHREADS=1\ -s\ WASM=1\ -msimd128\ -I`dirname \`which emcc\``/system/lib/libcxxabi/include/ \
    --enable-multithread \
    --enable-vp9-decoder \
    --disable-vp8-encoder \
    --disable-vp9-encoder \
    --disable-shared \
    --disable-docs \
    --disable-examples \
    --disable-tools \
    --disable-unit-tests \
|| exit 1

# compile libvpx
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
