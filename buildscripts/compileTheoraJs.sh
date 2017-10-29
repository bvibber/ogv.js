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
emconfigure ../../../libtheora/configure --disable-oggtest --prefix="$dir/build/js/root" --with-ogg="$dir/build/js/root" --disable-asm --disable-examples --disable-encode

# compile libtheora
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
