#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir liboggz
cd liboggz

# finally, run configuration script
emconfigure ../../../liboggz/configure --prefix="$dir/build/js/root" --disable-write

# compile liboggz
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
