ogv.js
======

libogg, libvorbis, and libtheora compiled to JavaScript with Emscripten, and to Flash with Crossbridge.


## Current status

A demo is included which runs some video output in the browser; you can
search within a list of Wikimedia Commons 'Media of the Day'. It will
appear under build/demo/

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/

* streaming: yes (buffering varies by browser)
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* [background threading: no](https://github.com/brion/ogv.js/wiki/Threading)
* [GPU accelerated drawing: yes (requires WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* seeking: no


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis media on browsers that don't support Ogg or WebM natively.

(Note that a more user-friendly solution in most cases is to provide media in both open and MPEG-LA formats, if you're not averse to using patent-encumbered formats. This will use much less CPU and battery than performing JavaScript decoding!)


Short-ish clips of a few seconds to at most a few minutes at SD resolution or below are the primary target media. This system should really not be used for full-length TV or movies, as it's going to eat battery horribly due to sustained high CPU usage.


The primary target browsers are (testing 360p/30fps):
* Safari 6.1+ on Mac OS X 10.8+
* Safari on iOS 7+ 64-bit
* Internet Explorer 10+ on Windows 7+ (JS)
* Internet Explorer 9 on Windows 7+ (Flash)

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 7+ 32-bit
* Internet Explorer 10+ on Windows RT

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS or Windows RT.)

Testing browsers (these support .ogv natively):
* Firefox 32
* Chrome 37

Experimental all-Flash support not yet tested on:
* Internet Explorer 6/7/8 on Windows XP/Vista/7


## Performance

Early versions have only been spot-checked with a couple of small sample files on a few devices, but for SD-or-less resolution basic decoding speed seems adequate on desktop. Newer mobile devices seem to handle at least low-res files, but much more tuning and measurement is needed.

*Target browsers*

On Mac OS X, Safari 6.1 and 7 perform much better than Safari 6.0. Note that Safari seems to disable the JIT when the developer console is open, so beware when debugging. WebGL acceleration works on OS X with developer options enabled and on iOS 8.

IE 10 and IE 11 on Windows 7, 8 and 8.1 perform pretty well. Older versions of IE are not supported at all for the JavaScript target. WebGL acceleration currently works with IE 11 update 1 and later.

IE 9 runs the demo page with the Flash version of the decoder, but IE 6/7/8 don't currently run the demo and so are untested.


*Low-res targets*

See [device notes](https://github.com/brion/ogv.js/wiki/Device-notes) for testing status.

On iOS 7, Safari performs significantly better than Chrome or other alternative browsers that are unable to enable the JIT due to iOS limitations on third-party developers. As of March 2014, I've gotten barely acceptable performance for 160p/15fps files on iPod Touch 5th-gen and iPad 3. Files at 360p and up play acceptably only on the latest 64-bit iPhones and iPads.

IE 11 on Windows RT 8.1 on an original Surface RT tablet performs barely acceptably with 160p/15fps files, but sound sync is poor (due to Flash overhead?). Larger files play unacceptably slowly.

In both cases, a native application looms as a possibly better alternative. If installed, a native app could definitely be launched from web content... Need to look into how easy it is to detect presence of apps from web, however; if it's not possible to detect it may need a UX workaround to prompt the user.


*Test browsers*

Firefox 32 performs best using asm.js optimizations.

Chrome 37 performs pretty well, but not quite as snappy as Firefox's asm.js mode.

It would also be good to compare performance of Theora vs VP8/VP9 decoders.


*WebGL drawing acceleration*

Accelerated YCbCr->RGB conversion and drawing can be done in WebGL on supporting browsers, and is enabled by default if available.

Performance in Firefox, Chrome, IE 11 update 1, iOS 8 Safari, and desktop Safari with WebGL option enabled is pretty good, and noticeably improves playback performance at HD and SD resolutions.

IE 10 and early versions of IE 11 do not support luminance textures; there used to be some code to work around by packing RGBA textures that but it's been removed to simplify things. See [GPU acceleration page](https://github.com/brion/ogv.js/wiki/GPU-acceleration) for more info.


*Flash decoder fallback*

The Flash version seems to decode video fairly well, but the YCbCr->RGB conversion had to be moved from ActionScript to C code to perform acceptably. This may be due to suboptimal ActionScript compiler settings, or may be due to a much better bytecode emitter for Crossbridge.

GPU-accelerated YCbCr->RGB conversion and drawing using Stage3d was tried, but performance was mediocre and scaling was poor, so it has been removed.


## Difficulties

*Threading*

Currently the video and audio codecs run on the UI thread.

In principle WebWorkers could be used to background the decoder as a subprocess, sending video frames and audio data back to the parent web page for output. This should be supported by all target and test browsers.

However there would be communication overhead that may make this not worth it; in particular on Internet Explorer 10/11 transferring ownership of ArrayBuffers across threads is not possible, so this will require extra data copies (extraction from heap, copy across boundary, insertion to heap).

See [Threading notes on the wiki](https://github.com/brion/ogv.js/wiki/Threading) for thoughts on how work could be broken over a couple of threads.

Note that in Flash, more direct heap sharing may be possible.


*Streaming*

In IE 10, the (MS-prefixed) Stream/StreamReader interface is used to read data on demand into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used to stream data, however there is no flow control so the file will buffer into memory as fast as possible, then drain over time.

Currently in Safari and Chrome, streaming is done by using a 'binary string' read. This has no flow control so will buffer into memory as fast as possible. This will also buffer up to twice the size of the total file in memory for the entire lifetime of the player, which is wasteful but there doesn't seem to be a way around it without dividing up into subrange requests.

In Flash, a URLStream is used. This is similar to the XHR+binary string in terms of flow control, but uses less memory.


*Seeking*

Seeking is tough; not yet implemented. Need to do some research:
* how to determine file length in time
* how to estimate position in file to seek to based on time target
* how to reinitialize the decoder context after seeking

Jumping to a new position in the file that hasn't yet been buffered could be accomplished using partial-content HTTP requests ('Range' header), but this requires CORS header adjustment on the server side.


*Audio output*

Firefox, Safari and Chrome support the W3C Web Audio API.

IE doesn't support Web Audio yet, but does bundle the Flash player. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

The all-Flash decoder fallback also supports audio.

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!


## Crossbridge issues

Crossbridge compiles hella slow, especially on the configure scripts.

Have not yet tested using Crossbridge on Linux (only on Mac).


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant negative impact on the decode time so we've gone back to libvorbis.

Libtheora needs a slight patch to a function signature to pass emscripten's checks for asm.js-mode function pointer compatibility.


## Building JS components

1. You will need autoconf, automake, and libtool. These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html).
3. `git submodule update --init`
4. Run `make js` to configure and build libogg, libvorbis, libtheora, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.

Run `make jsdemo` to build a version of the demo skipping the Flash player. This is handy if you want to test the emscripten stuff but don't want to or can't install Crossbridge. This will output into build/jsdemo/.


## Building Flash components

Rebuilding dynamicaudio.swf shim for IE 10/11:

1. Install [Apache Flex SDK](http://flex.apache.org/), and put it into PATH
2. `make swf` to rebuild src/dynamicaudio.swf
3. `make` to rebuild the demo and update its .swf

Building all-Flash fallback player:

1. Install [Apache Flex SDK](http://flex.apache.org/), and put it into PATH
2. Get [Crossbridge 1.0.1 download](http://sourceforge.net/projects/crossbridge/files/), and install SDK into ~/crossbridge
3. `git submodule update --init`
4. Run `make flash` to configure and build libogg, libvorbis, libtheora, and the C and ActionScript wrappers.
5. Go make a cup of coffee; the Crossbridge builds are a lot slower to make than the emscripten ones!


## Building the demo

If you did all the setup above, just run `make demo` or `make`. Look in build/demo/ and enjoy!

Note that the demo includes the JS and Flash players, so will take a while to build from scratch but is right quick once they're built. Once the C bits have been built, this gets much faster. :)


## License

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman (see src/AudioFeeder.js flash fallback section).

Flash/ActionScript3 player variant under MIT license.
