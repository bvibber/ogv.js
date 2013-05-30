#!/bin/bash

# configure libogg
cd libogg
if [ ! -f configure ]; then
  # generate configuration script
  ./autogen.sh
  
  # -O20 and -04 cause problems
  # see https://github.com/kripken/emscripten/issues/264
  sed -i '' 's/-O20/-O2/g' configure
  sed -i '' 's/-O4/-O2/g' configure
  
  # finally, run configuration script
  emconfigure ./configure
fi

# compile libogg
emmake make

# compile wrapper
cd ..
emcc -O2 -s ASM_JS=1 -s EXPORTED_FUNCTIONS="['_AVOggInit', '_AVOggRead', '_AVOggDestroy']" --js-library src/callback.js -I libogg/include -Llibogg/src/.libs/ -logg src/ogg.c -o build/libogg.js