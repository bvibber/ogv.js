#!/bin/bash

# configure libtheora
dir=`pwd`
cd libtheora
if [ ! -f configure ]; then
  # generate configuration script
  # disable running configure automatically
  sed -i '' 's/$srcdir\/configure/#/' autogen.sh
  ./autogen.sh
  
  # -O20 and -04 cause problems
  # see https://github.com/kripken/emscripten/issues/264
  sed -i '' 's/-O20/-O2/g' configure
  sed -i '' 's/-O4/-O2/g' configure
  
  # disable oggpack_writealign test
  sed -i '' 's/$ac_cv_func_oggpack_writealign/yes/' configure
  
  # finally, run configuration script
  emconfigure ./configure --disable-oggtest --with-ogg=$dir/libogg --with-ogg-libraries=$dir/libogg/src/.libs --disable-asm
fi

# compile libtheora
EMCC_CFLAGS="--ignore-dynamic-linking" emmake make

# compile wrapper
cd ..
emcc -O2 -s ASM_JS=1 -s EXPORTED_FUNCTIONS="['_TheoraTest']" --js-library src/callback.js -I libtheora/include -Llibtheora/lib/.libs -ltheora -I libogg/include -Llibogg/src/.libs -logg src/theora.c -o build/libtheora.js