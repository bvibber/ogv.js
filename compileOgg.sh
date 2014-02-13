#!/bin/bash

# configure libogg
cd libogg
if [ ! -f configure ]; then
  # generate configuration script
  ./autogen.sh
  
  # -O20 and -04 cause problems
  # see https://github.com/kripken/emscripten/issues/264
  sed -i.bak 's/-O20/-O2/g' configure
  sed -i.bak 's/-O4/-O2/g' configure
  
  # finally, run configuration script
  emconfigure ./configure
fi

# compile libogg
EMCC_CFLAGS="--ignore-dynamic-linking" emmake make

cd ..
