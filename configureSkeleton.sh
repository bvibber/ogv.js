#!/bin/bash

# configure libskeleton
dir=`pwd`
cd libskeleton
if [ ! -f configure ]; then
  # generate configuration script
  sed -i.bak 's/$srcdir\/configure/#/' autogen.sh
  ./autogen.sh
fi
cd ..
