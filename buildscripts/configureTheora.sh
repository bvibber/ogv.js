#!/bin/bash
set -e

# configure libtheora
dir=`pwd`
cd libtheora
if [ ! -f configure ]; then
  # generate configuration script
  ./autogen.sh
fi
cd ..
