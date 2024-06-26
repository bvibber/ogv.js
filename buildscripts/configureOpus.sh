#!/bin/bash
set -e

# configure libopus
dir=`pwd`
cd libopus
if [ ! -f configure ]; then
  # generate configuration script
  # disable running configure automatically
  sed -i.bak 's/$srcdir\/configure/#/' autogen.sh
  ./autogen.sh
  
  # disable oggpack_writealign test
  sed -i.bak 's/$ac_cv_func_oggpack_writealign/yes/' configure
fi
cd ..
