#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p liboggz
cd liboggz

# finally, run configuration script
emconfigure ../../../liboggz/configure \
    --prefix="$dir/build/js/root" \
    --disable-write \
    --disable-shared \
|| exit 1

# compile liboggz
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
