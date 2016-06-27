* 1.1.2-alpha.7 - 2016-06-21
 * use cleaner audio buffer thresholds
 * report time spent on worker proxy thread posting
 * cleaned up order of ops in threading
 * enforce a/v sync during slow frame decodes as well as at draw time
 * use native object-fit when available, except on iOS
 * allow loading workers cross-domain, if CORS is set up for base dir
 * allow loading Flash audio shim cross-domain for IE 11
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
