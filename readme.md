ogv.js
======

libogg, libvorbis, libtheora, libopus, and libnestegg compiled to JavaScript with Emscripten.


## Current status

A demo is included which runs some video output in the browser; you can
search within a list of Wikimedia Commons 'Media of the Day'. It will
appear under build/demo/

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/

See a sample of MediaWiki with seamless ogv.js playback mode for Safari/IE/Edge at https://ogvjs-testing.wmflabs.org/

* streaming: yes (with Range header)
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* [background threading: no](https://github.com/brion/ogv.js/wiki/Threading)
* [GPU accelerated drawing: yes (requires WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* seeking: yes for Ogg (with Range header), no for WebM
* SIMD acceleration: no

Ogg files are fairly well supported, but WebM is still very experimental.


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis or WebM media on browsers that don't support Ogg or WebM natively.

(Note that a more user-friendly solution in most cases is to provide media in both open and MPEG-LA formats, if you're not averse to using patent-encumbered formats. This will use much less CPU and battery than performing JavaScript decoding!)


Short-ish clips of a few seconds to at most a few minutes at SD resolution or below are the primary target media. This system should really not be used for full-length TV or movies, as it's going to eat battery horribly due to sustained high CPU usage.


The primary target browsers are (testing 360p/30fps):
* Safari 6.1/7/8 on Mac OS X 10.8/10.9
* Safari on iOS 7/8 64-bit
* Edge on Windows 10 (desktop and mobile)
* Internet Explorer 10/11 on Windows 7/8/8.1

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 7/8 32-bit
* Internet Explorer 10/11 on Windows RT

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS or Windows RT.)

Testing browsers (these support .ogv natively):
* Firefox 38
* Chrome 43


## Performance

As of 2015, for SD-or-less resolution basic Ogg Theora decoding speed seems adequate on desktop and newer high-end mobile devices. Older and low-end mobile devices may have difficulty on any but the lowest-resolution files.

WebM is much slower, and remains experimental.


*Target browsers*

On Mac OS X, Safari 6.1/7/8 perform much better than Safari 6.0. Note that Safari seems to disable the JIT when the developer console is open, so beware when debugging. Safari in iOS 8 works as well, with performance varying by CPU speed; an A7 or later 64-bit CPU is recommended for 360p video. WebGL acceleration works on OS X 10.9 and on iOS 8.

Edge (aka 'Project Spartan') on Windows 10 preview builds works on desktop and mobile devices. WebGL drawing acceleration and Web Audio are used natively; no plugins are required. As with iOS, mobile also works but lower-end devices are too slow for 360p.

IE 10 and IE 11 on Windows 7, 8 and 8.1 perform pretty well. Older versions of IE are not supported at all. WebGL acceleration currently works with IE 11 update 1 and later. IE 10/11 require the Flash plugin for audio and will automatically use it when available.


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

Accelerated YCbCr->RGB conversion and drawing can be done in WebGL on supporting browsers (Firefox, Chrome, IE 11 update 1, Edge, and Safari for iOS 8 & OS X 10.9), and is enabled by default if available.

WebGL noticeably improves playback performance at HD and SD resolutions.

IE 10 and early versions of IE 11 do not support luminance textures; there used to be some code to work around by packing RGBA textures that but it's been removed to simplify things. See [GPU acceleration page](https://github.com/brion/ogv.js/wiki/GPU-acceleration) for more info.


## Difficulties

*Threading*

Currently the video and audio codecs run on the UI thread.

In principle WebWorkers could be used to background the decoder as a subprocess, sending video frames and audio data back to the parent web page for output. This should be supported by all target and test browsers.

However there would be communication overhead that may make this not worth it; in particular on Internet Explorer 10/11 transferring ownership of ArrayBuffers across threads is not possible, so this will require extra data copies (extraction from heap, copy across boundary, insertion to heap).

See [Threading notes on the wiki](https://github.com/brion/ogv.js/wiki/Threading) for thoughts on how work could be broken over a couple of threads.


*Streaming*

In IE and Edge, the (MS-prefixed) Stream/StreamReader interface is used to read data on demand into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used to stream data, however there is no flow control so the file will buffer into memory as fast as possible, then drain over time.

Currently in Safari and Chrome, streaming is done by using a 'binary string' read. This has no flow control so will buffer into memory as fast as possible. This will also buffer up to twice the size of the total file in memory for the entire lifetime of the player, which is wasteful but there doesn't seem to be a way around it without dividing up into subrange requests.

The Firefox and Safari/Chrome cases have been hacked up to do streaming buffering by chunking the requests at about a megabyte each, using the HTTP Range header. For cross-site playback, this requires CORS setup to whitelist the Range header!


*Seeking*

Seeking is implemented via the HTTP Range: header.

Currently a simple manual bisection search is used to locate the target frame or audio position, which is very slow over the internet as it creates a lot of short-lived HTTP requests. It also doesn't quite grok all the packet timestamps and sometimes doesn't seek to a video keyframe correctly.

Planning to replace this with use of liboggz, which can use Ogg Skeleton information to seek much more directly.

May also need to fix reinitialization of Vorbis or Opus audio context after seeking.

As with chunked streaming, cross-site playback requires CORS support for the Range header.


*Audio output*

Firefox, Safari, Chrome, and Edge support the W3C Web Audio API.

IE doesn't support Web Audio, but does bundle the Flash player. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!

Note that autoplay doesn't work on iOS Safari due to limitations with starting audio playback.


*WebM*

WebM support was added in June 2015, and is currently very experimental. Not everything works yet, and performance is pretty bad. See [issue tracker for WebM milestone](https://github.com/brion/ogv.js/milestones/WebM%20playback) on the GitHub page.

The i/o model of the nestegg WebM container demuxing library is a bit different from what ogv.js was designed around so seeking is not yet supported and it may sometimes cut off partway through a file. Needs more work.


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant negative impact on the decode time so we've gone back to libvorbis.


## Building JS components

1. You will need autoconf, automake, libtool, and pkg-config. These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html).
3. `git submodule update --init`
4. Run `make js` to configure and build libogg, libvorbis, libtheora, libopus, libskeleton, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of the libraries is released.


## Building Flash components

Rebuilding dynamicaudio.swf shim for IE 10/11:

1. Install [Apache Flex SDK](http://flex.apache.org/), and put it into PATH
2. `make swf` to rebuild src/dynamicaudio.swf
3. `make` to rebuild the demo and update its .swf


## Building the demo

If you did all the setup above, just run `make demo` or `make`. Look in build/demo/ and enjoy!


## License

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman (see src/AudioFeeder.js flash fallback section).
