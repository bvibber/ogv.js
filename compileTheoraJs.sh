#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir theora
cd theora

# finally, run configuration script
emconfigure ../../../libs/theora/autogen.sh \
	--prefix="$dir/build/js/root" \
	--disable-asm \
	--disable-examples \
	--disable-encode \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig"

# compile libtheora
emmake make
emmake make install

cd ..
cd ..
cd ..
