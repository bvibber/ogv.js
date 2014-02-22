#!/bin/bash

# configure libvorbis
dir=`pwd`
cd libvorbis
if [ ! -f configure ]; then
  # generate configuration script
  # disable running configure automatically
  sed -i.bak 's/$srcdir\/configure/#/' autogen.sh
  ./autogen.sh
  
  # -O20 and -04 cause problems
  # see https://github.com/kripken/emscripten/issues/264
  sed -i.bak 's/-O20/-O2/g' configure
  sed -i.bak 's/-O4/-O2/g' configure
  
  # disable oggpack_writealign test
  sed -i.bak 's/$ac_cv_func_oggpack_writealign/yes/' configure
fi
cd ..

# set up the build directory
mkdir build
cd build

mkdir root
mkdir libvorbis
cd libvorbis
  
# finally, run configuration script
emconfigure ../../libvorbis/configure --disable-shared --disable-oggtest --prefix=$dir/build/root

# compile libvorbis
emmake make
emmake make install

cd ..
cd ..
