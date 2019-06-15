#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p libnestegg
cd libnestegg

# finally, run configuration script
EMCONFIGURE_JS=2 NM=/usr/bin/nm emconfigure \
    ../../../libnestegg/configure \
    --prefix="$dir/build/js/root" \
    --disable-shared \
|| exit 1

# compile libnestegg
emmake make -j4 || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..
