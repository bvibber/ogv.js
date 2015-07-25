ogv.js
======

Media decoder and player for Ogg Vorbis/Opus/Theora and (experimentally) WebM video.

Based around libogg, libvorbis, libtheora, libopus, libvpx, and libnestegg compiled to JavaScript with Emscripten.

## Updates

* 0.9.1
 * more sound sync fixes
 * IE 11/Edge WebGL perf improvements
* 0.9 - almost there!
 * controls attribute not yet supported
 * WebM is still experimental

## Current status

See a web copy of the demo at https://brionv.com/misc/ogv.js/demo/

See a sample of MediaWiki with seamless ogv.js playback mode for Safari/IE/Edge at https://ogvjs-testing.wmflabs.org/

* streaming: yes (with Range header)
* color: yes
* audio: yes, with a/v sync (requires Web Audio or Flash)
* [background threading: no](https://github.com/brion/ogv.js/wiki/Threading)
* [GPU accelerated drawing: yes (WebGL)](https://github.com/brion/ogv.js/wiki/GPU-acceleration)
* seeking: yes for Ogg (with Range header), no for WebM
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
  var player = new OGVPlayer({
    // If ogv-codec.js, dynamicaudio.swf etc are in another dir, tell us!
    base: '/path/to/resources'
  });

  // Now treat it just like a video or audio element
  containerElement.appendChild(player);
  player.src = 'path/to/media.ogv';
  player.play();
```

To check for compatibility before creating a player, include `ogv-support.js` and use the `OGVCompat` API:

```
  if (OGVCompat.supported('OGVPlayer')) {
    // go load the full player from ogv.js and instantiate stuff
  }
```

This will check for typed arrays, audio/Flash, blacklisted iOS versions, and super-slow/broken JIT compilers.

If you need a URL versioning/cache-buster parameter for `ogv.js`, you can use the `OGVVersion` symbol provided by `ogv-support.js` or the even tinier `ogv-version.js`:

```
  var script = document.createElement('script');
  script.src = 'ogv.js?version=' + encodeURIComponent(OGVVersion);
```


## Performance

As of 2015, for SD-or-less resolution basic Ogg Theora decoding speed seems adequate on desktop and newer high-end mobile devices. Older and low-end mobile devices may have difficulty on any but audio and the lowest-resolution video files.

WebM is much slower, and remains experimental.

*Low-res targets*

See [device notes](https://github.com/brion/ogv.js/wiki/Device-notes) for testing status.

On iOS 8, Safari performs significantly better than Chrome or other alternative browsers that are unable to enable the JIT due to iOS limitations on third-party developers. As of March 2014, I've gotten acceptable performance for 160p/15fps files on iPod Touch 5th-gen and iPad 3. Files at 360p and often 480p play acceptably on newer 64-bit iPhones and iPads.

IE 11 on Windows RT 8.1 on an original Surface RT tablet performs barely acceptably with 160p/15fps files, but sound sync is poor (due to Flash overhead?). Larger files play unacceptably slowly.

In both cases, a native application looms as a possibly better alternative. If installed, a native app could definitely be launched from web content... Need to look into how easy it is to detect presence of apps from web, however; if it's not possible to detect it may need a UX workaround to prompt the user.


*WebGL drawing acceleration*

Accelerated YCbCr->RGB conversion and drawing can be done in WebGL on supporting browsers (Firefox, Chrome, IE 11, Edge, and Safari for iOS 8 & OS X 10.9), and is enabled by default if available.

WebGL noticeably improves playback performance at HD and SD resolutions.

Early versions of IE 11 do not support luminance or alpha textures, and in IE 11 update 1 and Edge they are still unexpectedly slow. As a workaround, on IE and Edge the data is packed into RGBA textures for faster texture upload and unpacked in the shader. See [GPU acceleration page](https://github.com/brion/ogv.js/wiki/GPU-acceleration) for more info.


## Difficulties

*Threading*

Currently the video and audio codecs run on the UI thread.

WebWorkers could be used to background the decoder as a subprocess, sending video frames and audio data back to the parent web page for output. This should be supported by all target and test browsers.

However there would be communication overhead; in particular on Internet Explorer 10/11 transferring ownership of ArrayBuffers across threads is not possible, so this will require extra data copies (extraction from heap, copy across boundary, insertion to heap).

See [Threading](https://github.com/brion/ogv.js/wiki/Threading) and [Modularity and threading](https://github.com/brion/ogv.js/wiki/Modularity-and-threading) on the wiki for thoughts on how work could be broken over a couple of threads.


*Streaming download*

In IE and Edge, the (MS-prefixed) Stream/StreamReader interface is used to read data on demand into ArrayBuffer objects.

In Firefox, the 'moz-chunked-array' responseType on XHR is used to read data as ArrayBuffer chunks during download. Safari and Chrome use a 'binary string' read which requires manually converting input to ArrayBuffer chunks.

The Firefox and Safari/Chrome cases have been hacked up to do streaming buffering by chunking the requests at up to a megabyte each, using the HTTP Range header. For cross-site playback, this requires CORS setup to whitelist the Range header!

[Safari has a bug with Range headers](https://bugs.webkit.org/show_bug.cgi?id=82672) which is worked around as necessary with a 'cache-busting' URL string parameter. Hopefully this will be fixed in future versions of Mac OS X and iOS.


*Seeking*

Seeking is implemented via the HTTP Range: header.

For Ogg files with keyframe indices in a skeleton index, seeking is very fast. Otherwise,  a bisection search is used to locate the target frame or audio position, which is very slow over the internet as it creates a lot of short-lived HTTP requests.

For WebM files, seeking is not yet supported.

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


## Building JS components

1. You will need autoconf, automake, libtool, and pkg-config. These can be installed through Homebrew on Mac OS X, or through distribution-specific methods on Linux.
2. Install [Emscripten](http://kripken.github.io/emscripten-site/docs/getting_started/Tutorial.html).
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

libogg, libvorbis, and libtheora are available under their respective licenses, and the JavaScript and C wrapper code in this repo is licensed under MIT.

Based on build scripts from https://github.com/devongovett/ogg.js

dynamicaudio.as and other Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman (see src/AudioFeeder.js flash fallback section).
