#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir libopus
cd libopus
  
# finally, run configuration script
emconfigure ../../../libopus/configure --disable-asm --disable-oggtest --disable-doc --disable-extra-programs --prefix="$dir/build/js/root"

# compile libopus
emmake make
emmake make install

cd ..
cd ..
cd ..
