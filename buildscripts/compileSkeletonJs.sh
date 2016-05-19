#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir libskeleton
cd libskeleton
  
# finally, run configuration script
emconfigure ../../../libskeleton/configure \
	--prefix="$dir/build/js/root" \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig"

# compile libskeleton
emmake make -j4
emmake make install

cd ..
cd ..
cd ..
