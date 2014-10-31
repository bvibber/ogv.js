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
mkdir ogg
cd ogg

# finally, run configuration script
../../../libs/ogg/configure \
	--prefix="$dir/build/flash/root" \
	--disable-shared

# compile libogg
make
make install

cd ..
cd ..
cd ..
