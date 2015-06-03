#!/bin/bash

dir=`pwd`

# set up the build directory
mkdir build
cd build

mkdir js
cd js

mkdir root
mkdir libvpx
cd libvpx

#

# finally, run configuration script
EMCONFIGURE_JS=1 \
  emconfigure ../../../libvpx/configure \
    --prefix="$dir/build/js/root" \
    --target=generic-gnu \
    --extra-cflags=-I`dirname \`which emcc\``/system/lib/libcxxabi/include/

# compile libvpx
emmake make
emmake make install

cd ..
cd ..
cd ..
