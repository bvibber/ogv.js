ogv.js
======

libogg, libvorbis, and theora compiled to JavaScript with Emscripten.


## Current status

A demo is included which runs some brief video output in the browser.

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 <video> and <audio> tags which can be used for basic playback of Ogg Theora and Vorbis media on browsers that don't support Ogg or WebM natively.

(Note that a more user-friendly solution in most cases is to provide media in both open and MPEG-LA formats, if you're not averse to using patent-encumbered formats. This will use much less CPU and battery than performing JavaScript decoding!)


Short-ish clips of a few seconds to at most a few minutes at SD resolution or below are the primary target media. This system should really not be used for full-length TV or movies, as it's going to eat battery horribly due to sustained high CPU usage.


The primary target browsers are:
* Safari 6+ on Mac OS X, iOS
* Internet Explorer 10+ on Windows, Windows RT

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS or Windows RT.)


## Browser requirements

Requires ArrayBuffer support (for emscripten code), <canvas> element (for video output), and XMLHTTPRequest responseType property support (for loading .ogv file data).

W3C Web Audio API will be used for audio output on Safari; on IE it may be necessary to use a Flash 10 shim. (IE on Windows 8 ships with an embedded Flash plugin, so it does not require installation.)


## Performance

Early versions have only been spot-checked with a couple of small sample files on a few devices, but for SD-or-less resolution basic decoding speed seems adequate on desktop. Newer mobile devices seem to handle at least low-res files, but much more tuning and measurement is needed.

Note that on iOS, Safari performs *much* better than Chrome or other "alternative" browsers that use the system UIWebView but are unable to enable the JIT due to iOS limitations on third-party developers.

It would also be good to compare performance of Theora vs VP8/VP9 decoders.

YCbCr->RGB conversion could be done in WebGL on supporting browsers (IE 11), if that makes a measurable difference.


## Difficulties

*Streaming input*

The current standard for XMLHttpRequest can fetch data as an ArrayBuffer (convenient!) but doesn't have any provision for streaming content data during the download.

The current demo simply fetches the entire file into memory before playback, which is obviously not suitable in a general case...

It may be necessary to fake streaming by running a series of partial-content HTTP requests, staying a full chunk ahead to keep the buffers full.

*Seeking*

Seeking is tough. Need to do some research:
* how to determine file length in time
* how to estimate position in file to seek to based on time target
* how to reinitialize the decoder context after seeking

*Audio output*

Safari supports the W3C Web Audio API (with 'webkit' prefix), which should be sufficient for basic audio playback. Keying video synchronization off of timestamps reached in the audio stream may be best way to achieve sync.

Unfortunately IE doesn't support Web Audio yet... Audio playback on IE may need to use a shim via the Flash plugin (which is bundled), which may make sync more difficult as there's another layer between our JS code and the output.



## Building

1. Install [Emscripten](https://github.com/kripken/emscripten/wiki/Tutorial).
2. Clone git submodules
3. Install [importer](https://github.com/devongovett/importer) with `npm install importer -g`.
4. Run `make` to configure and build libogg, libvorbis, libtheora, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.

See a sample web page in demos/


## License

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js
