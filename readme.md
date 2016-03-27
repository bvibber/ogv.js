audio-feeder
============

The AudioFeeder class abstracts a buffered output pipe for uncompressed PCM
audio in the browser, supporting both the standard W3C Web Audio API and a
Flash-based fallback for IE 10/11.

AudioFeeder was written for the ogv.js in-browser Ogg/WebM media player, and
is suitable for use in custom audio and video playback.

## Copyright and license

* main AudioFeeder & Web Audio code path under MIT license, (c) 2013-2016 Brion Vibber
* dynamicaudio.as and Flash-related bits are based on code under BSD license, (c) 2010 Ben Firshman

## Updates

* 0.0.1 - 2016-03-27
 * Broken out from ogv.js, cleaning up to publish as npm module

## Browserify

If bundling via Browserify, set up the class like so:

```
var AudioFeeder = require('audio-feeder');
```

Then follow the instructions in the 'Usage' section below.

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
  });

  // Optional callback when the buffered data runs out!
  feeder.onstarve = function() {
    // We don't have more data, so we'll just close out here.
    feeder.close();

    // Beware this may be a performance-sensitive callback; it's recommended
    // to do expensive decoding or audio generation in a worker thread and
    // pass it through for buffering rather than doing on-demand decoding.
  };
});
```

## Options  

* audioContext: an AudioContext object to be use instead of creating a new one
* base: base path containing dynamicaudio.swf for IE 10/11 Flash fallback

## Data format

AudioFeeder works with 32-bit floating point PCM audio. Data packets are
represented as an array containing a separate Float32Array for each channel.

## Flash and Internet Explorer 10/11

Internet Explorer 10/11 do not support Web Audio but do bundle the Flash
player plugin on Windows 8/8.1. This is automatically used if detected
available.

Beware that the dynamicaudio.swf file must be made available for the Flash
fallback to work!

Flash output is resampled to 2-channel 44.1 kHz, which is the only supported
output format for dynamically generated audio in Flash.

## Rebuilding Flash shim

The Flash shim can be rebuilt from source using the Apache Flex SDK:

```
mxmlc -o dynamicaudio.swf -file-specs dynamicaudio.as
```
