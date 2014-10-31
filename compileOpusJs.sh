#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir opus
cd opus

# Opus needs to run autogen.sh and configure separately.
../../../libs/opus/autogen.sh

# finally, run configuration script
emconfigure ../../../libs/opus/configure \
	--disable-asm \
	--disable-doc \
	--disable-extra-programs \
	--prefix="$dir/build/js/root" \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig"

# compile libopus
emmake make
emmake make install

cd ..
cd ..
cd ..
