#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir -p build
cd build

mkdir -p js
cd js

mkdir -p root
mkdir -p libvorbis
cd libvorbis
  
# finally, run configuration script
emconfigure ../../../libvorbis/configure --disable-oggtest --prefix="$dir/build/js/root"

# compile libvorbis
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
