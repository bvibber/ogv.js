#!/bin/bash
set -e

# configure liboggz
dir=`pwd`
cd liboggz
if [ ! -f configure ]; then
  # generate configuration script
  ./autogen.sh
fi
cd ..
