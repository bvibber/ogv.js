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
emconfigure ../../../libopus/configure --disable-asm --disable-oggtest --disable-doc --disable-extra-programs --prefix="$dir/build/js/root"

# compile libopus
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
