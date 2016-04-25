#!/bin/bash

lib="$1"
opts="$2"

dir=`pwd`

# set up the build directory
mkdir -p build/js/root || exit 1
mkdir -p build/js/"$lib" || exit 1
cd build/js/"$lib"

# run configuration script
EMCONFIGURE_JS=1 \
emconfigure ../../../"$lib"/configure \
	--prefix="$dir/build/js/root" \
	PKG_CONFIG_PATH="$dir/build/js/root/lib/pkgconfig" \
	NM=/usr/bin/nm \
	$opts || exit 1

# nm is for nestegg. what is it?

# compile to llvm bitcode via emcc...
emmake make || exit 1
emmake make install || exit 1

cd ..
cd ..
cd ..


