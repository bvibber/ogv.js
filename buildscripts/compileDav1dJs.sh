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
CFLAGS="-O3" meson ../../../dav1d \
  --cross-file=../../../buildscripts/dav1d-emscripten-cross.txt \
  --prefix="$dir/build/js/root" \
  -Dbuild_asm=false \
  -Dbuild_tests=false \
  -Ddefault_library=shared && \
ninja && \
mkdir -p "$dir/build/js/root/lib" && \
cp -p src/libdav1d.so "$dir/build/js/root/lib/libdav1d.so" && \
mkdir -p "$dir/build/js/root/include/dav1d" && \
cp -p ../../../dav1d/include/dav1d/* "$dir/build/js/root/include/dav1d/"

# don't run ninja install, it breaks on mac
# trying to install_name_tool things?

cd ..
cd ..
cd ..
