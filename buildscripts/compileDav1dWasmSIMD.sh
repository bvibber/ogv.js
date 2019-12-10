#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm-simd
cd wasm-simd

mkdir -p root
mkdir -p dav1d
cd dav1d

# finally, run configuration script
meson ../../../dav1d \
  --cross-file=../../../buildscripts/dav1d-wasm-simd-cross.txt \
  --prefix="$dir/build/wasm-simd/root" \
  -Denable_asm=true \
  -Denable_tests=false \
  -Denable_tools=false \
  -Dbitdepths='["8"]' \
  -Ddefault_library=static \
  -Dfake_atomics=true \
  --buildtype release && \
ninja -v && \
mkdir -p "$dir/build/wasm-simd/root/lib" && \
cp -p src/libdav1d.a "$dir/build/wasm-simd/root/lib/libdav1d.a" && \
mkdir -p "$dir/build/wasm-simd/root/include/dav1d" && \
cp -p ../../../dav1d/include/dav1d/* "$dir/build/wasm-simd/root/include/dav1d/" && \
cp -p include/dav1d/version.h "$dir/build/wasm-simd/root/include/dav1d/" && \
cd .. && \
cd .. && \
cd ..
