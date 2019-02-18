1.5.8 - 2018-08-08
* fixes for a few stray globals
* update buildchain to emscripten 1.38.11
* update webpack to 4.x
    * minified main ogv.js endpoints
* opus built with --enable-float-approx
* fix display of WebM files with resolution changes
* fix green edges on some VP9 files
* update opus to 1.2.1
* update ogg to 1.3.3
* update vorbis to 1.3.6
* remove old 'delay-audio' A/V sync behavior mode
* added video, audio bitrate to stats & demo

1.5.7 - 2018-02-19
* fix for linear seek in audio/webm
* updated build chain to emscripten 1.37.34
* performance optimization for VP8 and VP9 on IE 11
    * roughly 15-25% performance improvement
    * uses direct multiplication instead of slow polyfill of Math.imul
* performance optimization for VP8 loop filter
    * roughly 10% performance improvement in Safari, Edge wasm builds
    * smaller improvement in JS
* performance optimization for Opus audio
    * now compiled with optimization, about 4x faster
* built module wrappers with closure compiler
    * shaves a few kilobites off load size
* updated audio-feeder to 0.4.9
    * volume changes now apply immediately on IE
    * float precision for audio on IE

1.5.6 - 2018-01-29
* detect and work around WebAssembly failure on iOS 11.2.2/11.2.5

1.5.5 - 2018-01-22
* allow linear seeking on WebM files without cues, such as audio/webm

1.5.4 - 2018-01-19
* updated yuv-canvas to 1.2.1
    * fixes playback on iOS 9
* fix loading of WebM files under 256kb

1.5.3 - 2018-01-18
* fix canPlayType() to recognize WebM
* updated build chain to emscripten 1.37.28
* minor internal source cleanup

1.5.2 - 2017-12-09
* use magic bytes sniffing to choose demuxer
    * fixes WebM in blobs and in Safari
* update to stream-file 0.2.3
    * fixes error loading blob URLs in Safari

1.5.1 - 2017-12-05
* use Content-Type to choose demuxer instead of URL extension (rolled back in 1.5.2)

1.5.0 - 2017-11-09
* cleaned up console logging
* enable WebM by default
* enable WebAssembly by default if available
* allow memory growth on WebAssembly
* build modules with -O3 instead of -O2
* disabled experimental pthreads build for now
* updated yuv-canvas
    * improved image filtering/scaling on Windows
    * work around broken object-fit on Edge 16
* updated stream-file to 0.2.1
    * fixes error on abort during network load

1.4.2 - 2017-04-24
* support 8-bit 4:2:2 and 4:4:4 subsampling in VP9

1.4.1 - 2017-04-07
* fix for seek shortly after initialization
* fix for some missing instance constants

1.4.0 - 2017-04-06
* fastSeek() is now fast; seeks to first keyframe found.
* VP9 base profile support in WebM container (8-bit 4:2:0 only).
* Safari no longer complains about missing es6-promise.map source map
* Smoother playback on low-end machines prone to lag spikes: when A/V sync lags, keep audio running smoothly and resync video at the next keyframe. To restore previous behavior, set `sync: 'delay-audio'` in options.
* Experimental Web Assembly builds of all modules; set `wasm: true` in options to force on.
* `error` property now returns an `OGVMediaError` object instead of string.
* Decode pipeline up to 3 frames deep to aid in momentary spikes.
* Experimental multithreaded JS builds for VP8 and VP9; set `threading: true` in options to force on.
* Fixed bad autodetection of files in root dir

1.3.1 - 2017-02-24
* Fix for seeking before load completes
* Fix for bisection seeking in very short Ogg files

1.3.0 - 2017-02-08
* Separated XHR and caching out to stream-file package
* more aggressive in-memory buffering should improve audio seek performance
* improved seek precision on audio files
* fix for Ogg files with stream id of 0

1.2.1 - 2016-09-24
* Performance fixed for playback of Ogg Theora with many duplicate frames ("1000fps" files from ffmpeg)
* Report actual fps (ignoring dupe frames) for Ogg Theora
* Delay loading when using preload="none"
* Fix regression in IE 10 network layer

1.2.0 - 2016-09-19
* Separated software and WebGL paths to yuv-canvas package
* fixed regression in WebM frame rate handling
* buffer up to 3 decoded frames for smoother playback
* smoother audio in the face of short delays (drop late frame if next one is already decoded)
* fixed regression in seeking non-indexed Ogg files
* updated libvpx

1.1.3 - 2016-06-27
* fix play-during-seek bug that interacted with video.js badly

1.1.2 - 2016-06-27
* better a/v sync
* muted autoplay works on iOS
* numerous seeking-related race-condition fixes
* more consistent performance on low-end machines
* supports cross-domain hosting of worker and Flash audio shim
* seeking now works in WebM as well as Ogg
* cleaner multithreading
* lots of little fixes

1.1.2-alpha.7 - 2016-06-21
* use cleaner audio buffer thresholds
* report time spent on worker proxy thread posting
* cleaned up order of ops in threading
* enforce a/v sync during slow frame decodes as well as at draw time
* use native object-fit when available, except on iOS
* allow loading workers cross-domain, if CORS is set up for base dir
* allow loading Flash audio shim cross-domain for IE 11

1.1.2-alpha.6 - 2016-06-06
* smoothed out CPU spikes from demuxer on slow machines (iPad 3)
* use XHR progress events to avoid hitting xhr.responseText early
* stream chunking fixes
* fixes for end of file
* pre-decode 1s of audio to smooth out beginning of playback a bit
* IE/Edge now uses Range-based chunking instead of MSStream for better proxy compatibility
* Fix for start of file when returned buffers are small
* Fix ended event for reals
* Fix end state when using muted audio

1.1.2-alpha.5 - 2016-06-04
* updated audio-feeder to 0.4.2 with IE and Web Audio fixes
* fix for hanging playback in certain threading conditions
* allow video decode and audio decode to be in parallel as well as drawing and decode
* pipeline multiple audio packet decodes for better slow IE perf
* fixes to late-frame a/v resynchronization
* new demo perf graph
* framecallback reports more per-frame info

1.1.2-alpha.4 - 2016-06-01
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

1.1.2-alpha.3 - 2016-05-28
* partial error handling of failure to load initial data

1.1.2-alpha.2 - 2016-05-28
* default video memory limit back to 32MB
* 'memoryLimit' option key to override video decoder memory limit

1.1.2-alpha.1 - 2016-05-28
* more seek fixes
* fixed bug in StreamFile buffering that broke some seeks
* retooled loop to avoid recursion crashes in Chrome
* enabled WebGL on more devices (no longer using failIfMajorPerformanceCaveat: true)
* fixed inflated CPU time reporting when using worker threads
* bumped up video codec memory limits to 64MB to aid with 4K testing

1.1.2-alpha.0 - 2016-05-22
* fix memory leak in WebM demuxer
* allow WebM files to play all the way to end
* implement seeking in WebM

1.1.1 - 2016-05-18
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

1.1.0 - 2016-05-10
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

1.0 - 2015-09-04
* initial stable release, as used on Wikipedia
