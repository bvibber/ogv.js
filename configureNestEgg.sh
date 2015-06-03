#!/bin/bash

# configure libnestegg
dir=`pwd`
cd libnestegg
if [ ! -f configure ]; then
  # generate configuration script
  autoreconf --install
fi
cd ..
