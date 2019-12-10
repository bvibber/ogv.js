#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm-mt
cd wasm-mt

mkdir -p root
mkdir -p dav1d
cd dav1d

# finally, run configuration script
CFLAGS=-pthread \
LDFLAGS=-pthread \
  meson ../../../dav1d \
  --cross-file=../../../buildscripts/dav1d-wasm-mt-cross.txt \
  --prefix="$dir/build/wasm-mt/root" \
  -Denable_asm=false \
  -Denable_tests=false \
  -Denable_tools=false \
  -Dbitdepths='["8"]' \
  -Ddefault_library=static \
  --buildtype release && \
ninja -v && \
mkdir -p "$dir/build/wasm-mt/root/lib" && \
cp -p src/libdav1d.a "$dir/build/wasm-mt/root/lib/libdav1d.a" && \
mkdir -p "$dir/build/wasm-mt/root/include/dav1d" && \
cp -p ../../../dav1d/include/dav1d/* "$dir/build/wasm-mt/root/include/dav1d/" && \
cp -p include/dav1d/version.h "$dir/build/wasm-mt/root/include/dav1d/" && \
cd .. && \
cd .. && \
cd ..
