#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p wasm
cd wasm

mkdir -p root
mkdir -p dav1d
cd dav1d

# finally, run configuration script
meson ../../../dav1d \
  --cross-file=../../../buildscripts/dav1d-wasm-cross.txt \
  --prefix="$dir/build/wasm/root" \
  -Dbuild_asm=false \
  -Dbuild_tests=false \
  -Dbitdepths='["8"]' \
  -Ddefault_library=static \
  --buildtype release && \
ninja -v && \
mkdir -p "$dir/build/wasm/root/lib" && \
cp -p src/libdav1d.a "$dir/build/wasm/root/lib/libdav1d.a" && \
mkdir -p "$dir/build/wasm/root/include/dav1d" && \
cp -p ../../../dav1d/include/dav1d/* "$dir/build/wasm/root/include/dav1d/" && \
cp -p include/dav1d/version.h "$dir/build/wasm/root/include/dav1d/" && \
cd .. && \
cd .. && \
cd ..
