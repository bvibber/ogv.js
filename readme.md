audio-feeder
============

The AudioFeeder class abstracts a buffered output pipe for uncompressed PCM
audio in the browser, supporting both the standard W3C Web Audio API and a
Flash-based fallback for IE 10/11.

AudioFeeder was written for the [ogv.js in-browser Ogg/WebM media player](https://github.com/brion/ogv.js),
and is suitable for use in custom audio and video playback.

## Copyright and license

* main AudioFeeder & Web Audio code path under MIT license, (c) 2013-2016 Brion Vibber
* dynamicaudio.as and some Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman

## Updates
* 0.4.4 - 2016-06-12
 * Web Audio: fix regression in `initSharedAudioContext`
* 0.4.3 - 2016-06-11
 * Flash: now works cross-domain
 * Web Audio: `audioNode` option allows attaching to non-default destination
* 0.4.2 - 2016-06-03
 * Flash: fixed sample count in cached playback data
 * Web Audio: partial fixes to `stop()`/`start()` buffered audio recovery
* 0.4.1 - 2016-06-02
 * Flash: Cleaned up internal buffering
 * Flash: `stop()`/`start()` more reliable, doesn't drop audio
 * Flash: `playbackPosition` no longer advances while paused
 * Now builds on Windows 10
* 0.4.0 - 2016-05-14
 * more precise recovery of playback position after `stop()`/`start()`
 * addded `flush()` method; use to clear buffers after a stop when seeking etc
* 0.3.0 - 2016-05-03
 * Implemented `onstarved` callback for Flash backend
 * Added `onbufferlow` callback when buffered data gets low, but not yet empty
 * Added `bufferThreshold` property to get/set the threshold in seconds
 * Added `durationBuffered` property to track amount of data left to play
 * Added `playbackPosition` property mirroring getPlaybackState().playbackPosition
 * Retooled Flash plugin setup to use a callback instead of timer-based polling
* 0.2.1 - 2016-04-28
 * Fixed regression in Flash build makefile
* 0.2.0 - 2016-04-27
 * Refactored build to use Grunt instead of make for JS build
 * Pre-built JS included in npm package instead of webpack-specific sources
 * Webpack projects now responsible for including dynamicaudio.swf
* 0.1.0 - 2016-04-16
 * Refactored code paths and build process!
 * Can now be imported directly into a webpack-based project
 * 'make build' to pre-build standalone .js to use in other build processes
* 0.0.2 - 2016-03-27
 * Broken out from ogv.js, cleaning up to publish as npm module

## Installing with webpack or browserify

If your project is built with webpack or browserify, it's easy to bundle up
AudioFeeder's JavaScript classes; you will have to manually ensure that the
Flash shim for IE is bundled alongside it.

Add to your npm dependencies:

```
npm install audio-feeder
```

and in your using code, set up the class like so:

```
var AudioFeeder = require('audio-feeder');
```

You will need to ensure that dynamicaudio.swf is included along with your
bundled JS/HTML/etc output to support IE 10/11, and may need to manually set
the base path in the options to the AudioFeeder constructor.

## Including AudioFeeder manually in a project

Grab AudioFeeder.js or AudioFeeder.min.js (minified) from the ZIP download or
from dist/ subdir in the npm module.

Include either as a module (CommonJS or AMD) or a standalone script.

## Usage

```
// Create a feeder object
var feeder = new AudioFeeder({
  // Supply the path to dynamicaudio.swf for IE 10/11 compatibility
  base: "/path/to/resources"
});

// Set up 2-channel stereo, 48 kHz sampling rate
feeder.init(2, 48000);

// Flash mode for IE 10/11 requires waiting.
feeder.waitUntilReady(function() {

  // Buffer some data before we start playback...
  //
  // Each channel gets its own 32-bit float array of samples;
  // this will be 0.25 seconds of silence at 2ch/48kHz.
  //
  // Note it's ok for each bufferData() call to have a different
  // number of samples, such as when working with a data format
  // with variable packet size (Vorbis).
  //
  feeder.bufferData([
    new Float32Array(12000),
    new Float32Array(12000)
  ]);

  // Start playback...
  feeder.start();

  document.querySelector('button.stop').addEventListener('click', function() {
    // You can pause output at any time:
    feeder.stop();
    // to release resources, call feeder.close() instead.
  });

  // Callback when buffered data runs below feeder.bufferThreshold seconds:
  feeder.onbufferlow = function() {
    while (feeder.durationBuffered < feeder.bufferThreshold) {
      feeder.bufferData([
        new Float32Array(12000),
        new Float32Array(12000)
      ]);
    }
  };

});
```

See also the included demo.html file for a live sample web page.

## Options  

* audioContext: an AudioContext object to be use instead of creating a new one
* base: base path containing dynamicaudio.swf for IE 10/11 Flash fallback

## Data format

AudioFeeder works with 32-bit floating point PCM audio. Data packets are
represented as an array containing a separate Float32Array for each channel.

Warning: this may change to use a wrapper class before 1.0.

## Status and audio/video synchronization

The current playback position in seconds, and the duration of buffered but not
yet played data, are available through the `playbackPosition` and
`durationBuffered` properties.

Additional playback state can be retrieved from the getPlaybackState() method:

```
{
  playbackPosition: Float /* seconds of sample data that have played back so far */,
  samplesQueued: Float /* samples remaining before the buffer empties out, approximate */,
  dropped: Integer /* count of buffer underrun events */,
  delayed: Float /* total seconds of silence played to cover underruns */
}
```

Warning: this structure may change before 1.0.

playbackPosition tracks the time via actual samples output, corrected for drops
and underruns. This value is suitable for use in scheduling output of synchronized
video frames.

This high-level pseudocode shows a simplified version of the playback sync logic
from the [ogv.js video player](https://github.com/brion/ogv.js):

```
function processMediaData() {
  while (codec.audioReady && audioFeeder.durationBuffered < audioFeeder.bufferThreshold) {
    // When our audio buffer gets low, feed it some more audio data.
    audioFeeder.bufferData(decodeAudioPacket());
  }

  if (codec.frameReady && audioFeeder.playbackPosition >= codec.nextFrameTimestamp) {
    // When the audio playback has reached the scheduled time position
    // of the next frame, decode and draw it.
    player.drawFrame(codec.decodeVideoPacket());
  }

  // And check back in before the next frame!
  if (codec.dataPending) {
    requestAnimationFrame(processMediaData);
  }
}

// Fire off an animation-based loop...
requestAnimationFrame(processMediaData);

// If in a background thread, animation loops will be throttled.
// Also fire when audio gets low!
audioFeeder.onbufferlow = processMediaData;
```

The caller is responsible for maintaining a loop and scheduling any decoding,
frame drawing, etc.

## Performance considerations

Beware that setTimeout, setInterval, and requestAnimationFrame may be throttled
on background tabs, leading to spotty performance if scheduling decoding
based on them.

To avoid background tab throttling, use the `onbufferlow` event callback
to run additional decoding/buffering. This is fired asynchronously when
the available buffered data runs below `bufferThreshold` seconds.

You can buffer an arbitrarily large amount of audio data, but for non-trivial
examples it's best to decode or generate audio in smallish chunks and buffer
them over time. Pre-buffering will eat more memory, and could lead to slowness
on the main thread if you process a lot of data on the main thread in one
function call.

Performing other slow tasks on the foreground thread may also prevent the
Web Audio API or Flash callbacks from being called in a timely fashion,
resulting in audio underruns even if lots of data has been buffered up.

## Events

There are currently two supported events, set via the 'onstarved' and
'onbufferlow' properties.

'onstarved' is called when buffered data runs out during playback,
giving a last-chance opportunity to buffer more data. This is a synchronous
call in the audio path, and may not be enough to guarantee good performance.

'onbufferlow' is called asynchronously when the buffered data runs
lower than a configurable threshold, which is more flexible. This
threshold is available for get and set via the `bufferThreshold` property,
defaulting to twice the low-level buffer duration.

You can use these events to buffer additional data at the last minute,
or to trigger a close-out of the feeder when no more data is available.

Todo:
* add events for beginning of playback?
* add event for scheduled end of playback

## Flash and Internet Explorer 10/11

Internet Explorer 10/11 do not support Web Audio but do bundle the Flash
player plugin on Windows 8/8.1. This is automatically used if detected
available.

Beware that the dynamicaudio.swf file must be made available for the Flash
fallback to work!

Flash output is resampled to 2-channel 44.1 kHz, which is the only supported
output format for dynamically generated audio in Flash.

## Rebuilding pre-packed AudioFeeder.js

The pre-packed AudioFeeder.js included in ZIP and npm releases can be rebuilt
from the source files. This is known to work on Mac, Linux, and Windows.

Build prerequisites:
* node.js / npm

```
# Fetch build dependencies (webpack, eslint etc)
npm install
npm install -g grunt-cli

# Lint and rebuild
grunt
```

This will produce a 'dist' subdirectory containing a ready to use
AudioFeeder.js, AudioFeeder.min.js, and dynamicaudio.swf, as well as
a demo.html example page.


## Rebuilding Flash shim

The Flash shim can be rebuilt from source using the Apache Flex SDK.
The Makefile in this project fetches a local copy of the SDK, which
is not conveniently packaged.

Building the Flash shim is known to work on Mac OS X and Linux, or
on Windows 10 with Cygwin shell plus native Java/Ant.

Build prerequisites:

* bash
* make
* java
* ant
* curl

```
# Rebuild dynamicaudio.swf, installing Flex SDK if necessary
make swf
```

Be warned that downloading libraries for the Apache Flex SDK may prompt
you for permission at your terminal!

```
# To remove just the dynamicaudio.swf
make clean

# To remove the Flex SDK
make distclean
```
