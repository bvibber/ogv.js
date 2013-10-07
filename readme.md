ogg.js
======

libogg, libvorbis, and theora compiled to JavaScript with Emscripten, based on an audio codec version for [Aurora.js](https://github.com/audiocogs/aurora.js).

## Building

1. Install [Emscripten](https://github.com/kripken/emscripten/wiki/Tutorial).
2. Clone git submodules
3. Install [importer](https://github.com/devongovett/importer) with `npm install importer -g`.
4. Run `make` to configure and build libogg, libvorbis, libtheora, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.

See a sample web page in demos/

## License

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo
for Aurora.js is licensed under MIT.

Based on wrapper scripts from https://github.com/devongovett/ogg.js
