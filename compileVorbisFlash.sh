#!/bin/bash

export PATH="$HOME/crossbridge/sdk/usr/bin:$PATH"
export CFLAGS=-O4

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir flash
cd flash

mkdir root
mkdir vorbis
cd vorbis
  
# finally, run configuration script
../../../libs/vorbis/configure \
  --disable-shared \
  --disable-oggtest \
  --prefix="$dir/build/flash/root"

# compile libvorbis
make
make install

cd ..
cd ..
cd ..
