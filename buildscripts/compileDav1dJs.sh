#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p dav1d
cd dav1d

# finally, run configuration script
meson ../../../dav1d \
  --cross-file=../../../buildscripts/dav1d-asmjs-cross.txt \
  --prefix="$dir/build/js/root" \
  -Denable_asm=false \
  -Denable_tests=false \
  -Denable_tools=false \
  -Dbitdepths='["8"]' \
  -Ddefault_library=static \
  -Dfake_atomics=true \
  --buildtype release && \
ninja -v && \
mkdir -p "$dir/build/js/root/lib" && \
cp -p src/libdav1d.a "$dir/build/js/root/lib/libdav1d.a" && \
mkdir -p "$dir/build/js/root/include/dav1d" && \
cp -p ../../../dav1d/include/dav1d/* "$dir/build/js/root/include/dav1d/" && \
cp -p include/dav1d/version.h "$dir/build/js/root/include/dav1d/" && \
cd .. && \
cd .. && \
cd ..
