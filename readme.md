ogv.js
======

Media decoder and player for Ogg Vorbis/Opus/Theora and (experimentally) WebM video.

Based around libogg, libvorbis, libtheora, libopus, libvpx, and libnestegg compiled to JavaScript with Emscripten.

## Updates

* 0.9.9
 * auto-detect resource base dir
 * console cleanup
 * misc fixes
* 0.9.8
 * quick fix for IE audio stuttering
* 0.9.7
 * disable WebGL if using software rendering
 * reduce Flash comms overhead in IE
* 0.9.6
 * fixes for IE 10
* 0.9.5
 * fix pause/play regression
* 0.9.4
 * fix regressions
* 0.9.3
 * internal partial async retooling
 * web worker threading, enabled by default
 * note the dist files have changed!
* 0.9.2
 * fix for time reporting issue
* 0.9.1
 * more sound sync fixes
 * IE 11/Edge WebGL perf improvements
* 0.9 - almost there!
 * controls attribute not yet supported
 * WebM is still experimental

## Current status

As of August 2015, ogv.js can be seen in action [on Wikipedia and Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Video) in Safari and IE/Edge where native Ogg and WebM playback is not available. (See [technical details on MediaWiki integration](https://www.mediawiki.org/wiki/Extension:TimedMediaHandler/ogv.js).)

See also a standalone demo with performance metrics at https://brionv.com/misc/ogv.js/demo/

* streaming: yes (with Range header)
* seeking: yes for Ogg (with Range header), no for WebM
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* background threading: yes (video, audio decoders in Workers)
* [GPU accelerated drawing: yes (WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* GPU accelerated decoding: no
* SIMD acceleration: no
* controls: no (currently provided by demo or other UI harness)

Ogg files are fairly well supported, but WebM is still very experimental.


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis or WebM media on browsers that don't support Ogg or WebM natively.

The API isn't quite complete, but works pretty well.


## Compatibility

ogv.js requires a fast JS engine with typed arrays, and either Web Audio or Flash for audio playback.

The primary target browsers are (testing 360p/30fps):
* Safari 6.1/7/8 on Mac OS X 10.7/10.8/10.9
* Safari on iOS 8 64-bit
* Edge on Windows 10 desktop/tablet
* Internet Explorer 10/11 on Windows 7/8/8.1 (desktop/tablet)

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 8 32-bit
* Edge on Windows 10 Mobile
* Internet Explorer 10/11 on Windows RT

Older versions of Safari have flaky JIT compilers. IE 9 and below lack typed arrays.

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS, Windows RT, or Windows 10 Mobile.)

Testing browsers (these support .ogv natively):
* Firefox 39
* Chrome 43


## Usage

The `OGVPlayer` class implements a player, and supports a subset of the events, properties and methods from [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) and [HTMLVideoElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement).

```
  // Create a new player with the constructor
  var player = new OGVPlayer();

  // Or with options
  var player = new OGVPlayer({
    enableWebM: true
  });

  // Now treat it just like a video or audio element
  containerElement.appendChild(player);
  player.src = 'path/to/media.ogv';
  player.play();
  player.addEventListener('ended', function() {
    // ta-da!
  });
```

To check for compatibility before creating a player, include `ogv-support.js` and use the `OGVCompat` API:

```
  if (OGVCompat.supported('OGVPlayer')) {
    // go load the full player from ogv.js and instantiate stuff
  }
```

This will check for typed arrays, audio/Flash, blacklisted iOS versions, and super-slow/broken JIT compilers.

If you need a URL versioning/cache-buster parameter for dynamic loading of `ogv.js`, you can use the `OGVVersion` symbol provided by `ogv-support.js` or the even tinier `ogv-version.js`:

```
  var script = document.createElement('script');
  script.src = 'ogv.js?version=' + encodeURIComponent(OGVVersion);
  document.querySelector('head').appendChild(script);
```

Usually, ogv.js will auto-detect the path to its resources based on the script element that loads ogv.js or ogv-support.js. If you load ogv.js through a non-customary bundler (such as MediaWiki's ResourceLoader) you may need to override this manually before instantiating players:

```
  // Path to ogv-demuxer-ogg.js, ogv-worker-audio.js, dynamicaudio.swf etc
  OGVLoader.base = '/path/to/resources';
```


## Performance

As of 2015, for SD-or-less resolution basic Ogg Theora decoding speed is reliable on desktop and newer high-end mobile devices; current high-end desktops and laptops can even reach HD resolutions. Older and low-end mobile devices may have difficulty on any but audio and the lowest-resolution video files.

WebM is much slower, and remains experimental.

*Low-res targets*

I've gotten acceptable performance for Vorbis audio and 160p/15fps Theora files on 32-bit iOS devices: iPhone 4s, iPod Touch 5th-gen and iPad 3. These have difficulty at 240p and above, and just won't keep up with higher resolutions.

Meanwhile, newer 64-bit iPhones and iPads are comparable to low-end laptops, and videos at 360p and often 480p play acceptably. Since 32-bit and 64-bit iOS devices have the same user-agent, a benchmark must be used to approximately test minimum CPU speed.

(On iOS 8, Safari performs significantly better than Chrome or other alternative browsers that are unable to enable the JIT due to iOS limitations on third-party developers. Again, a benchmark must be used to detect slow performance, as the browser remains otherwise compatible.)


Windows on 32-bit ARM platforms is similar... IE 11 on Windows RT 8.1 on a Surface tablet (NVidia Tegra 3), and Edge on Windows 10 Mobile build 10166 on a Lumia 635, perform acceptably with audio and with 160p/15fps videos but have trouble starting around 240p.


In both cases, a native application looms as a possibly better alternative. See [OGVKit ](https://github.com/brion/OGVKit) and [OgvRt](https://github.com/brion/OgvRT) projects for experiments in those directions.


Note that at these lower resolutions, Vorbis audio and Theora video decoding are about equally expensive operations -- dual-core phones and tablets should be able to eek out a little parallelism here thanks to audio and video being in separate Worker threads.


*WebGL drawing acceleration*

Accelerated YCbCr->RGB conversion and drawing is done using WebGL on supporting browsers (Firefox, Chrome, IE 11, Edge, and Safari for iOS 8 & OS X 10.9), and is enabled by default if available.

WebGL noticeably improves playback performance at HD and SD resolutions.

Early versions of IE 11 do not support luminance or alpha textures, and in IE 11 update 1 and Edge they are still unexpectedly slow on Windows (in all browsers so far). As a workaround, on Windows the data is packed into RGBA textures for faster texture upload and unpacked in the shader. See [GPU acceleration page](https://github.com/brion/ogv.js/wiki/GPU-acceleration) for more info.


It may be possible to do further acceleration of actual decoding operations using WebGL shaders, but this could be ... tricky. WebGL is also only available on the main thread, and there are no compute shaders yet so would have to use fragment shaders.


## Difficulties

*Threading*

Currently the video and audio codecs run in worker threads by default, while the demuxer
and player logic run on the UI thread. This seems to work pretty well.

There is some overhead in extracting data out of each emscripten module's heap and in the thread-to-thread communications, but the parallelism and smoother main thread makes up for it.


*Streaming download*

In IE and Edge, the (MS-prefixed) Stream/StreamReader interface is used to read data on demand into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used to read data as ArrayBuffer chunks during download. Safari and Chrome use a 'binary string' read which requires manually converting input to ArrayBuffer chunks.

The Firefox and Safari/Chrome cases have been hacked up to do streaming buffering by chunking the requests at up to a megabyte each, using the HTTP Range header. For cross-site playback, this requires CORS setup to whitelist the Range header!

[Safari has a bug with Range headers](https://bugs.webkit.org/show_bug.cgi?id=82672) which is worked around as necessary with a 'cache-busting' URL string parameter. Hopefully this will be fixed in future versions of Mac OS X and iOS.


*Seeking*

Seeking is implemented via the HTTP Range: header.

For Ogg files with keyframe indices in a skeleton index, seeking is very fast. Otherwise,  a bisection search is used to locate the target frame or audio position, which is very slow over the internet as it creates a lot of short-lived HTTP requests.

For WebM files, seeking is not yet supported; this will require refactoring the demuxer modules to present a synchronous i/o abstraction to the demuxer library.

As with chunked streaming, cross-site playback requires CORS support for the Range header.


*Audio output*

Firefox, Safari, Chrome, and Edge support the W3C Web Audio API.

IE doesn't support Web Audio, but does bundle the Flash player in Windows 8/8.1/RT. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!

Note that autoplay doesn't work on iOS Safari due to limitations with starting audio playback from event handlers.


*WebM*

WebM support was added in June 2015, and is currently very experimental. Not everything works yet, and performance is pretty bad. See [issue tracker for WebM milestone](https://github.com/brion/ogv.js/milestones/WebM%20playback) on the GitHub page.

The i/o model of the nestegg WebM container demuxing library is a bit different from what ogv.js was designed around so seeking is not yet supported and it may sometimes cut off partway through a file. Needs more work.

To enable, set `enableWebM: true` in your `options` array.


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant negative impact on the decode time so we've gone back to libvorbis.

The Ogg Skeleton library (libskeleton) is a bit ... unfinished and is slightly modified here.


## Building JS components

Building ogv.js is known to work on Mac OS X and Linux (tested Ubuntu 15.04).

1. You will need autoconf, automake, libtool, and pkg-config. These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html); currently using the 1.34.1 SDK release for distribution builds.
3. `git submodule update --init`
4. Run `make js` to configure and build the libraries and the C wrapper


## Building Flash components

Rebuilding dynamicaudio.swf shim for IE 10/11:

1. Install [Apache Flex SDK](http://flex.apache.org/), and put it into PATH
2. `make swf` to rebuild src/dynamicaudio.swf
3. `make` to rebuild the demo and update its .swf


## Building the demo

If you did all the setup above, just run `make demo` or `make`. Look in build/demo/ and enjoy!


## License

libogg, libvorbis, libtheora, libopus, nestegg, and libvpx are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman (see src/AudioFeeder.js flash fallback section).
