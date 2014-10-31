#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir ogg
cd ogg

# finally, run configuration script
emconfigure ../../../libs/ogg/autogen.sh \
	--prefix="$dir/build/js/root" \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig"

# compile libogg
emmake make
emmake make install

cd ..
cd ..
cd ..
