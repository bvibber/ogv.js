#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p libopus
cd libopus

# finally, run configuration script
emconfigure ../../../libopus/configure \
  --disable-asm \
  --disable-intrinsics \
  --disable-doc \
  --disable-extra-programs \
  --prefix="$dir/build/js/root" \
  --disable-shared \
  CFLAGS="-O3" || exit 1

# compile libopus
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
