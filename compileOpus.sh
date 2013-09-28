# configure libopus
cd libopus
if [ ! -f configure ]; then
  # generate and run configuration script
  ./autogen.sh
  emconfigure ./configure --enable-fixed-point
fi

# compile libopus
emmake make

# generate JS
cd ..
emcc -O2 -s ASM_JS=1 -s EXPORTED_FUNCTIONS="['_opus_decoder_create', '_opus_decode_float']" libopus/.libs/libopus.dylib -o build/libopus.js