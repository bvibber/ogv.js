#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir libogg
cd libogg

# finally, run configuration script
emconfigure ../../../libogg/configure --prefix="$dir/build/js/root"

# compile libogg
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
