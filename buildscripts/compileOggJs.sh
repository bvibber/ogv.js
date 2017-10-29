#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p libogg
cd libogg

# finally, run configuration script
emconfigure ../../../libogg/configure --prefix="$dir/build/js/root"

# compile libogg
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
