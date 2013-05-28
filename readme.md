oggvorbis.js
============

libogg and libvorbis compiled to JavaScript with Emscripten for [Aurora.js](https://github.com/audiocogs/aurora.js).

## Building

1. Install [Emscripten](https://github.com/kripken/emscripten/wiki/Tutorial).
2. Clone git submodules
3. Run `compile.sh` to configure and build libogg and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.
4. Run `importer src/ogg.js build/ogg.js` to generate a JavaScript file with libogg and the Aurora.js wrapper, or to run a development server use `importer src/ogg.js -p 5000` for example.

## License

libogg and libvorbis are available under their respective licenses, and the JavaScript and C wrapper code in this repo
for Aurora.js is licensed under MIT.