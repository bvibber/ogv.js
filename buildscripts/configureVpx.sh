#!/bin/bash

# configure libvpx
dir=`pwd`
cd libvpx
if grep 'ARFLAGS = -crs' build/make/configure.sh; then

  # issue with llvm-ar; see https://code.google.com/p/webm/issues/detail?id=566
  sed -i.bak 's/ARFLAGS = -crs/ARFLAGS = crs/' build/make/configure.sh
fi
cd ..
