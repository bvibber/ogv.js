#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir vorbis
cd vorbis
  
# finally, run configuration script
emconfigure ../../../libs/vorbis/autogen.sh \
	--prefix="$dir/build/js/root" \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig"

# compile libvorbis
emmake make
emmake make install

cd ..
cd ..
cd ..
