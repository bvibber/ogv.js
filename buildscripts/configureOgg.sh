#!/bin/bash

# configure libogg
dir=`pwd`
cd libogg
if [ ! -f configure ]; then
  # generate configuration script
  sed -i.bak 's/$srcdir\/configure/#/' autogen.sh
  ./autogen.sh
fi
cd ..
