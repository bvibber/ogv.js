ogv.js
======

libogg, libvorbis, and theora compiled to JavaScript with Emscripten.


## Current status

A demo is included which runs some video output in the browser; you can
select from a list of Wikimedia Commons 'Media of the Day', which are
loaded live from the web.

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis media on browsers that don't support Ogg or WebM natively.

(Note that a more user-friendly solution in most cases is to provide media in both open and MPEG-LA formats, if you're not averse to using patent-encumbered formats. This will use much less CPU and battery than performing JavaScript decoding!)


Short-ish clips of a few seconds to at most a few minutes at SD resolution or below are the primary target media. This system should really not be used for full-length TV or movies, as it's going to eat battery horribly due to sustained high CPU usage.


The primary target browsers are:
* Safari 6+ on Mac OS X, iOS
* Internet Explorer 10+ on Windows, Windows RT

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS or Windows RT.)


## Browser requirements

Requires ArrayBuffer support (for emscripten code), canvas element (for video output), and XMLHTTPRequest streaming binary text support (for loading .ogv file data).

W3C Web Audio API will be used for audio output on Safari; on IE it may be necessary to use a Flash 10 shim. (IE on Windows 8 ships with an embedded Flash plugin, so it does not require installation.)


## Performance

Early versions have only been spot-checked with a couple of small sample files on a few devices, but for SD-or-less resolution basic decoding speed seems adequate on desktop. Newer mobile devices seem to handle at least low-res files, but much more tuning and measurement is needed.

Note that on iOS, Safari performs *much* better than Chrome or other "alternative" browsers that use the system UIWebView but are unable to enable the JIT due to iOS limitations on third-party developers.

Firefox performs best using asm.js optimizations -- unfortunately due to limitations in the JS engine this currently only works on the first video playthrough. Reload the page to force a video to re-run at high speed.

It would also be good to compare performance of Theora vs VP8/VP9 decoders.

YCbCr->RGB conversion could be done in WebGL on supporting browsers (IE 11), if that makes a measurable difference.


## Difficulties

*Streaming input*

In IE 10, the (MS-prefixed) Stream/StreamReader interface is used to read data progressively into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used similarly.

Currently in Safari and Chrome, streaming is done by using a 'binary string' read. This may buffer up to twice the size of the original file in addition to the codec's buffer, but seems to be the only way in WebKit to do reads during download currently.

Note that the C heap has been locked to 128M to ensure there's room for files to buffer fully.


*Seeking*

Seeking is tough. Need to do some research:
* how to determine file length in time
* how to estimate position in file to seek to based on time target
* how to reinitialize the decoder context after seeking

Jumping to a new position in the file that hasn't yet been buffered could be accomplished using partial-content HTTP requests ('Range' header), but this requires CORS header adjustment on the server side.


*Audio output*

Safari supports the W3C Web Audio API (with 'webkit' prefix), which should be sufficient for basic audio playback. Keying video synchronization off of timestamps reached in the audio stream may be best way to achieve sync.

Unfortunately IE doesn't support Web Audio yet... Audio playback on IE may need to use a shim via the Flash plugin (which is bundled), which may make sync more difficult as there's another layer between our JS code and the output.

Firefox seems to support Web Audio in the latest versions but is newish, and may be behind a config switch.

Chrome and Safari seem to have some issues with audio launching in my testing, needs more investigation.


## Building

1. Install [Emscripten](https://github.com/kripken/emscripten/wiki/Tutorial).
2. `git submodule update --init`
3. Install [importer](https://github.com/devongovett/importer) with `npm install importer -g`.
4. Run `make` to configure and build libogg, libvorbis, libtheora, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.

See a sample web page in demos/


## License

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js
