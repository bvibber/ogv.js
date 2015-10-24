#!/bin/bash

# configure libnestegg
dir=`pwd`
cd libnestegg
if [ ! -f configure ]; then

  # hack out this symbol filtering option, it blows up on emscripten target for now
  sed -i.bak 's/src_libnestegg_la_LDFLAGS/#src_libnestegg_la_LDFLAGS/' Makefile.am
  
  # generate configuration script
  autoreconf --install
fi
cd ..
