#!/bin/bash
set -e

# configure libskeleton
dir=`pwd`
cd libskeleton
if [ ! -f configure ]; then
  # generate configuration script
  sed -i.bak 's/$srcdir\/configure/#/' autogen.sh
  ACLOCAL_PATH="$dir/build/wasm/root/share/aclocal" ./autogen.sh
fi
cd ..
