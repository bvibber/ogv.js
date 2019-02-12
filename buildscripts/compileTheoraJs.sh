#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p libtheora
cd libtheora

# finally, run configuration script
emconfigure ../../../libtheora/configure \
    --disable-oggtest \
    --prefix="$dir/build/js/root" \
    --with-ogg="$dir/build/js/root" \
    --disable-asm \
    --disable-examples \
    --disable-encode \
    --disable-shared \
|| exit 1

# compile libtheora
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
