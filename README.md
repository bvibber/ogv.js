ogv.js
======

Media decoder and player for Ogg Vorbis/Opus/Theora and (experimentally) WebM video.

Based around libogg, libvorbis, libtheora, libopus, libvpx, and libnestegg compiled to JavaScript with Emscripten.

## Updates

* 1.1.2-alpha.7 - 2016-06-??
 * use cleaner audio buffer thresholds
 * report time spent on worker proxy thread posting
 * cleaned up order of ops in threading
 * enforce a/v sync during slow frame decodes as well as at draw time
* 1.1.2-alpha.6 - 2016-06-06
 * smoothed out CPU spikes from demuxer on slow machines (iPad 3)
 * use XHR progress events to avoid hitting xhr.responseText early
 * stream chunking fixes
 * fixes for end of file
 * pre-decode 1s of audio to smooth out beginning of playback a bit
 * IE/Edge now uses Range-based chunking instead of MSStream for better proxy compatibility
 * Fix for start of file when returned buffers are small
 * Fix ended event for reals
 * Fix end state when using muted audio
* 1.1.2-alpha.5 - 2016-06-04
 * updated audio-feeder to 0.4.2 with IE and Web Audio fixes
 * fix for hanging playback in certain threading conditions
 * allow video decode and audio decode to be in parallel as well as drawing and decode
 * pipeline multiple audio packet decodes for better slow IE perf
 * fixes to late-frame a/v resynchronization
 * new demo perf graph
 * framecallback reports more per-frame info
* 1.1.2-alpha.4 - 2016-06-01
 * use smaller streaming read chunk size on IE for smoother perf
 * demux less aggressively
 * lazy-extract buffers from strings on Safari for smoother demuxing perf on slow iOS
 * tweak to liboggz to reduce ogg demux overhead on slow iOS
 * retooled playback loop for better threading parallelism
 * increased audio buffer sizes for smoother playback on slow machines
 * recover from streaming timeouts in IE/Edge
 * fix some streaming chunk-boundary bugs in Safari/Chrome/Firefox
 * restore a/v sync much faster after late frames by pausing audio
 * fixes for duplicate frame handling and "1000fps" Theora files
* 1.1.2-alpha.3 - 2016-05-28
 * partial error handling of failure to load initial data
* 1.1.2-alpha.2 - 2016-05-28
 * default video memory limit back to 32MB
 * 'memoryLimit' option key to override video decoder memory limit
* 1.1.2-alpha.1 - 2016-05-28
 * more seek fixes
 * fixed bug in StreamFile buffering that broke some seeks
 * retooled loop to avoid recursion crashes in Chrome
 * enabled WebGL on more devices (no longer using failIfMajorPerformanceCaveat: true)
 * fixed inflated CPU time reporting when using worker threads
 * bumped up video codec memory limits to 64MB to aid with 4K testing
* 1.1.2-alpha.0 - 2016-05-22
 * fix memory leak in WebM demuxer
 * allow WebM files to play all the way to end
 * implement seeking in WebM
* 1.1.1 - 2016-05-18
 * fix for regression when hitting 'play' during loading
 * fix for Theora streams with pathologically high frequency of dupe frames
 * fix for unmuting after muted play on iOS
 * when playback starts muted, drive on timer instead of audio clock
 * update to audio-feeder 0.4.0
 * much cleaner audio behavior on pause/continue
 * revert "release audio resources during pause/seek"
 * pause event now fired before ended
 * avoid infinite 'ended' events
 * fix slight a/v sync loss after pause/play
 * release audio resources during pause/seek
 * fix occasional loss of a/v sync after source switch
 * loadeddata event now fired
* 1.1.0 - 2016-05-10
 * fixed background tab audio performance
 * fixed race condition in poster removal
 * updated audio-feeder to 0.3.0
 * refactored parts of build using webpack
 * reduction in unnecessary globals
 * added stubs for standard properties
 * volume property now works
 * seeking is much more reliable
 * switching sources is much more reliable
 * Chrome input corruption bug fixed
 * console spam on oggs without skeleton track fixed
* 1.0 - 2015-09-04
 * initial stable release, as used on Wikipedia

## Current status

Since August 2015, ogv.js can be seen in action [on Wikipedia and Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Video) in Safari and IE/Edge where native Ogg and WebM playback is not available. (See [technical details on MediaWiki integration](https://www.mediawiki.org/wiki/Extension:TimedMediaHandler/ogv.js).)

See also a standalone demo with performance metrics at https://brionv.com/misc/ogv.js/demo/

* streaming: yes (with Range header)
* seeking: yes for Ogg and WebM (with Range header)
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* background threading: yes (video, audio decoders in Workers)
* [GPU accelerated drawing: yes (WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* GPU accelerated decoding: no
* SIMD acceleration: no
* controls: no (currently provided by demo or other UI harness)

Ogg files are fairly well supported, but WebM is still very experimental and is disabled by default.


## Goals

Long-form goal is to create a drop-in replacement for the HTML5 video and audio tags which can be used for basic playback of Ogg Theora and Vorbis or WebM media on browsers that don't support Ogg or WebM natively.

The API isn't quite complete, but works pretty well.


## Compatibility

ogv.js requires a fast JS engine with typed arrays, and either Web Audio or Flash for audio playback.

The primary target browsers are (testing 360p/30fps):
* Safari 6.1/7/8/9 on Mac OS X 10.7-10.11
* Safari on iOS 8/9 64-bit
* Edge on Windows 10 desktop/tablet
* Internet Explorer 10/11 on Windows 7/8/8.1/10 (desktop/tablet)

And for lower-resolution files (testing 160p/15fps):
* Safari on iOS 8/9 32-bit
* Edge on Windows 10 Mobile
* Internet Explorer 10/11 on Windows RT

Older versions of Safari have flaky JIT compilers. IE 9 and below lack typed arrays.

(Note that Windows and Mac OS X can support Ogg and WebM by installing codecs or alternate browsers with built-in support, but this is not possible on iOS, Windows RT, or Windows 10 Mobile.)

Testing browsers (these support .ogv and .webm natively):
* Firefox 46
* Chrome 50


## Package installation

Pre-built releases of ogv.js are available as [.zip downloads from the GitHub releases page](https://github.com/brion/ogv.js/releases) and through the npm package manager.

You can load the `ogv.js` main entry point directly in a script tag, or bundle it through whatever build process you like. The other .js files and the .swf file (for audio in IE) must be made available for runtime loading, together in the same directory.

ogv.js will try to auto-detect the path to its resources based on the script element that loads ogv.js or ogv-support.js. If you load ogv.js through another bundler (such as browserify or MediaWiki's ResourceLoader) you may need to override this manually before instantiating players:

```
  // Path to ogv-demuxer-ogg.js, ogv-worker-audio.js, dynamicaudio.swf etc
  OGVLoader.base = '/path/to/resources';
```

To fetch from npm:

```
npm install ogv
```

The distribution-ready files will appear in 'node_modules/ogv/dist'.

To load the player library into your browserify or webpack project:

```
var ogv = require('ogv');

// Access public classes either as ogv.OGVPlayer or just OGVPlayer.
// Your build/lint tools may be happier with ogv.OGVPlayer!
ogv.OGVLoader.base = '/path/to/resources';
var player = new ogv.OGVPlayer();
```

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

## Distribution notes

Entry points:
* `ogv.js` contains the main runtime classes, including OGVPlayer, OGVLoader, and OGVCompat.
* `ogv-support.js` contains the OGVCompat class and OGVVersion symbol, useful for checking for runtime support before loading the main `ogv.js`.
* `ogv-version.js` contains only the OGVVersion symbol.

These entry points may be loaded directly from a script element, or concatenated into a larger project, or otherwise loaded as you like.

Further code modules are loaded at runtime, which must be available with their defined names together in a directory. Currently the files should be hosted same-origin to the web page that includes them, or the worker threads and Flash audio shim may not load correctly.

Dynamically loaded assets:
* `ogv-worker-audio.js` and `ogv-worker-video.js` are Worker entry points, used to run video and audio decoders in the background.
* `ogv-demuxer-ogg.js` is used in playing .ogg, .oga, and .ogv files.
* `ogv-demuxer-webm.js` is used in playing .webm files.
* `ogv-decoder-audio-vorbis.js` and `ogv-decoder-audio-opus.js` are used in playing both Ogg and WebM files containing audio.
* `ogv-decoder-video-theora.js` is used in playing .ogg and .ogv video files.
* `ogv-decoder-video-vp8.js` is used in playing .webm video files.
* `dynamicaudio.swf` is the Flash audio shim, used for Internet Explorer 10/11.

If you know you will never use particular formats or codecs you can skip bundling them; for instance if you only need to play Ogg files you don't need `ogv-demuxer-webm.js` or `ogv-decoder-video-vp8.js` which are only used for WebM.


## Performance

As of 2015, for SD-or-less resolution basic Ogg Theora decoding speed is reliable on desktop and newer high-end mobile devices; current high-end desktops and laptops can even reach HD resolutions. Older and low-end mobile devices may have difficulty on any but audio and the lowest-resolution video files.

WebM is much slower, and remains experimental.

*Low-res targets*

I've gotten acceptable performance for Vorbis audio and 160p/15fps Theora files on 32-bit iOS devices: iPhone 4s, iPod Touch 5th-gen and iPad 3. These have difficulty at 240p and above, and just won't keep up with higher resolutions.

Meanwhile, newer 64-bit iPhones and iPads are comparable to low-end laptops, and videos at 360p and often 480p play acceptably. Since 32-bit and 64-bit iOS devices have the same user-agent, a benchmark must be used to approximately test minimum CPU speed.

(On iOS, Safari performs significantly better than some alternative browsers that are unable to enable the JIT due to use of the old UIWebView API. Chrome 49 and Firefox for iOS are known to work using the newer WKWebView API internally. Again, a benchmark must be used to detect slow performance, as the browser remains otherwise compatible.)


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

For WebM files with cues, efficient seeking is supported as well as of 1.1.2.

As with chunked streaming, cross-site playback requires CORS support for the Range header.


*Audio output*

Audio output is handled through the [AudioFeeder](https://github.com/brion/audio-feeder) library, which encapsulates use of Web Audio API or Flash depending on browser support:

Firefox, Safari, Chrome, and Edge support the W3C Web Audio API.

IE doesn't support Web Audio, but does bundle the Flash player in Windows 8/8.1/RT. A small Flash shim is included here and used as a fallback -- thanks to Maik Merten for hacking some pieces together and getting this working!

A/V synchronization is performed on files with both audio and video, and seems to
actually work. Yay!

Note that autoplay with audio doesn't work on iOS Safari due to limitations with starting audio playback from event handlers; if playback is started outside an event handler, the player will hang due to broken audio.

As of 1.1.1, muting before script-triggered playback allows things to work:

```
  player = new OGVPlayer();
  player.muted = true;
  player.src = 'path/to/file-with-audio.ogv';
  player.play();
```

You can then unmute the video in response to a touch or click handler. Alternately if audio is not required, do not include an audio track in the file.


*WebM*

WebM support was added in June 2015, with some major issues finally worked out in May 2016. It remains experimental, but should be fully enabled in the future once a few more bugs are worked out. Beware that performance of WebM VP8 decoding is much slower than Ogg Theora.

To enable, set `enableWebM: true` in your `options` array.


## Upstream library notes

We've experimented with tremor (libivorbis), an integer-only variant of libvorbis. This actually does *not* decode faster, but does save about 200kb off our generated JavaScript, presumably thanks to not including an encoder in the library. However on slow devices like iPod Touch 5th-generation, it makes a significant negative impact on the decode time so we've gone back to libvorbis.

The Ogg Skeleton library (libskeleton) is a bit ... unfinished and is slightly modified here.


## Building JS components

Building ogv.js is known to work on Mac OS X and Linux (tested Ubuntu 15.04).

1. You will need autoconf, automake, libtool, pkg-config, and node (nodejs). These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html); currently using the 1.34.1 SDK release for distribution builds.
3. `git submodule update --init`
4. Run `npm install` to install build utilities
5. Run `make js` to configure and build the libraries and the C wrapper


## Building the demo

If you did all the setup above, just run `make demo` or `make`. Look in build/demo/ and enjoy!


## License

libogg, libvorbis, libtheora, libopus, nestegg, and libvpx are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

[AudioFeeder](https://github.com/brion/audio-feeder)'s dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman.
