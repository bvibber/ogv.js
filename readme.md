ogv.js
======

libogg, libvorbis/tremor, and libtheora compiled to JavaScript with Emscripten.


## Current status

A demo is included which runs some video output in the browser; you can
search within a list of Wikimedia Commons 'Media of the Day'. It will
appear under build/demo/

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/

* streaming: mostly works (buffering varies by browser)
* color: yes
* audio: yes, with a/v sync
* background threading: no


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis media on browsers that don't support Ogg or WebM natively.

(Note that a more user-friendly solution in most cases is to provide media in both open and MPEG-LA formats, if you're not averse to using patent-encumbered formats. This will use much less CPU and battery than performing JavaScript decoding!)


Short-ish clips of a few seconds to at most a few minutes at SD resolution or below are the primary target media. This system should really not be used for full-length TV or movies, as it's going to eat battery horribly due to sustained high CPU usage.


The primary target browsers are:
* Safari 6.1+ on Mac OS X
* Internet Explorer 10+ on Windows

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 7+
* Internet Explorer 10+ on Windows RT

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS or Windows RT.)

Testing browsers (these support .ogv natively):
* Firefox 27
* Chrome 32


## Performance

Early versions have only been spot-checked with a couple of small sample files on a few devices, but for SD-or-less resolution basic decoding speed seems adequate on desktop. Newer mobile devices seem to handle at least low-res files, but much more tuning and measurement is needed.

*Target browsers*

On Mac OS X, Safari 6.1 and 7 perform much better than Safari 6.0. Note that Safari seems to disable the JIT when the developer console is open, so beware when debugging.

IE 10 and IE 11 on Windows 8 and 8.1 perform pretty well. Older versions of IE are not supported at all.


*Low-res targets*

See [device notes](https://github.com/brion/ogv.js/wiki/Device-notes) for testing status.

On iOS 7, Safari performs significantly better than Chrome or other alternative browsers that are unable to enable the JIT due to iOS limitations on third-party developers. As of March 2014, I've gotten barely acceptable performance for 160p/15fps files on iPod Touch 5th-gen and iPad 3. Files at 360p play acceptably only on the latest 64-bit iPhone 5s.

IE 11 on Windows RT 8.1 on an original Surface RT tablet performs barely acceptably with 160p/15fps files, but sound sync is poor (due to Flash overhead?). Larger files play unacceptably slowly.

In both cases, a native application looms as a possibly better alternative. If installed, a native app could definitely be launched from web content... Need to look into how easy it is to detect presence of apps from web, however; if it's not possible to detect it may need a UX workaround to prompt the user.


*Test browsers*

Firefox 27 performs best using asm.js optimizations -- unfortunately due to limitations in the JS engine this currently only works on the first video playthrough. Reload the page to force a video to re-run at high speed.

Chrome 32 performs pretty well, but not quite as snappy as Firefox's asm.js mode.

It would also be good to compare performance of Theora vs VP8/VP9 decoders.

YCbCr->RGB conversion could be done in WebGL on supporting browsers (IE 11, Chrome, Firefox), if that makes a measurable difference.


## Difficulties

*Threading*

Currently the video and audio codecs run on the UI thread, which can make the UI jumpy and the audio crackly.

WebWorkers will be used to background the decoder as a subprocess, sending video frames and audio data back to the parent web page for output. This should be supported by all target and test browsers.

It may not be possible to split up the codec work over multiple workers, but this will at least get us off the UI thread and make the page more responsive during playback.


*Streaming*

In IE 10, the (MS-prefixed) Stream/StreamReader interface is used to read data on demand into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used to stream data, however there is no flow control so the file will buffer into memory as fast as possible, then drain over time.

Currently in Safari and Chrome, streaming is done by using a 'binary string' read. This has no flow control so will buffer into memory as fast as possible. This will also buffer up to twice the size of the total file in memory for the entire lifetime of the player, which is wasteful but there doesn't seem to be a way around it without dividing up into subrange requests.


*Seeking*

Seeking is tough. Need to do some research:
* how to determine file length in time
* how to estimate position in file to seek to based on time target
* how to reinitialize the decoder context after seeking

Jumping to a new position in the file that hasn't yet been buffered could be accomplished using partial-content HTTP requests ('Range' header), but this requires CORS header adjustment on the server side.


*Audio output*

Safari and Chrome support the W3C Web Audio API (with 'webkit' prefix).

Audio is blacklisted on Safari 6.0 due to a possible bug in the JavaScript VM or JIT compiler -- Vorbis audio *decoding* hangs the CPU unless the debug console is open (which makes things run rreeaallyy ssllooww). This may or may not be fixed in the latest builds, but I no longer have Safari 6.0 handy to test.

Firefox supports Web Audio API in recent versions.

IE doesn't support Web Audio yet, but does bundle the Flash player. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!


## Emscripten issues

Something in the combination of the relooper and the code generation in the current release versions of emscripten causes a hang on arm64 iOS devices such as the iPhone 5s somewhere in Vorbis audio decoding. Disabling the relooper gets it working but slashes performance horribly.

Building with the new [LLVM backend 'fastcomp'](https://github.com/kripken/emscripten/wiki/LLVM-Backend) seems to avoid hitting the iOS JIT bug while retaining full relooper performance.


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant impact on the decode time.

Libtheora needs a slight patch to a function signature to pass emscripten's checks for asm.js-mode function pointer compatibility.


## Building

1. Install [Emscripten](https://github.com/kripken/emscripten/wiki/Tutorial).
2. `git submodule update --init`
3. Install [importer](https://github.com/devongovett/importer) with `npm install importer -g`.
4. Run `make` to configure and build libogg, libvorbis, tremor, libtheora, and the C wrapper. Run this again whenever you make changes to the C wrapper or a new version of libogg is released.

See a sample web page in build/demo/


## License

libogg, libvorbis, tremor, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman (see src/AudioFeeder.js flash fallback section).
