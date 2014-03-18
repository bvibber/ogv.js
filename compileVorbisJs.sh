#!/bin/bash

export CFLAGS=-Os

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir libvorbis
cd libvorbis
  
# finally, run configuration script
emconfigure ../../../libvorbis/configure --disable-shared --disable-oggtest --prefix="$dir/build/js/root"

# compile libvorbis
emmake make
emmake make install

cd ..
cd ..
cd ..
