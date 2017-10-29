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
EMCONFIGURE_JS=1 NM=/usr/bin/nm emconfigure ../../../libnestegg/configure --prefix="$dir/build/js/root"

# compile libnestegg
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
