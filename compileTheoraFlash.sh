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
mkdir libtheora
cd libtheora

# finally, run configuration script
../../../libtheora/configure --disable-oggtest --prefix="$dir/build/flash/root" --with-ogg="$dir/build/flash/root" --disable-asm --disable-examples --disable-encode --disable-shared

# compile libtheora
make
make install

cd ..
cd ..
cd ..
