require('es6-promise').polyfill();

var YUVCanvas = require('yuv-canvas');

// -- OGVLoader.js
var OGVLoader = require("./OGVLoader.js");

// -- StreamFile.js
var StreamFile = require('stream-file');

// -- AudioFeeder.js
var AudioFeeder = require("audio-feeder"),
	dynamicaudio_swf = require("audio-feeder/dist/dynamicaudio.swf");

// -- Bisector.js
var Bisector = require("./Bisector.js");

// -- OGVMediaType.js
var OGVMediaType = require("./OGVMediaType.js");

// -- OGVWrapperCodec.js
var OGVWrapperCodec = require("./OGVWrapperCodec.js");

// -- OGVDecoderAudioProxy.js
var OGVDecoderAudioProxy = require("./OGVDecoderAudioProxy.js");

// -- OGVDecoderVideoProxy.js
var OGVDecoderVideoProxy = require("./OGVDecoderVideoProxy.js");

/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
// FIXME: not use window scope if possible here
var OGVTimeRanges = window.OGVTimeRanges = function(ranges) {
	Object.defineProperty(this, 'length', {
		get: function getLength() {
			return ranges.length;
		}
	});
	this.start = function(i) {
		return ranges[i][0];
	};
	this.end = function(i) {
		return ranges[i][1];
	};
	return this;
};

var OGVMediaErrorConstants = {
	MEDIA_ERR_ABORTED: 1,
	MEDIA_ERR_NETWORK: 2,
	MEDIA_ERR_DECODE: 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};
function extend(dest, src) {
	for (prop in src) {
		if (src.hasOwnProperty(prop)) {
			dest[prop] = src[prop];
		}
	}
}

/**
 * Constructor for analogue of the MediaError class
 * returned by HTMLMediaElement.error property
 */
var OGVMediaError = window.OGVMediaError = function(code, message) {
	this.code = code;
	this.message = message;
};
extend(OGVMediaError, OGVMediaErrorConstants);
extend(OGVMediaError.prototype, OGVMediaErrorConstants);

/**
 * Player class -- instantiate one of these to get an 'ogvjs' HTML element
 * which has a similar interface to the HTML audio/video elements.
 *
 * @param options: optional dictionary of options:
 *                 'base': string; base URL for additional resources, such as Flash audio shim
 *                 'webGL': bool; pass true to use WebGL acceleration if available
 *                 'forceWebGL': bool; pass true to require WebGL even if not detected
 *                 'sync': string; A/V sync plan: one of:
 *                     'delay-audio' (pre-1.3.2 behavior) stop audio when behind, then play all frames to catch up
 *                     'skip-frames' (default) to preserve audio, skipping frames until the next sync point (keyframe)
 */
var OGVPlayer = function(options) {
	options = options || {};

	var instanceId = 'ogvjs' + (++OGVPlayer.instanceCount);

	var codecClass = null,
		codecType = null;

	var canvasOptions = {};
	if (options.webGL !== undefined) {
		// @fixme confirm format of webGL option
		canvasOptions.webGL = options.webGL;
	}
	if(!!options.forceWebGL) {
		canvasOptions.webGL = 'required';
	}

	// Experimental options
	var enableWebM = !!options.enableWebM;

	// Running the codec in a worker thread equals happy times!
	var enableWorker = !!window.Worker;
	if (typeof options.worker !== 'undefined') {
		enableWorker = !!options.worker;
	}
	var enableThreading = !!options.threading;
	var enableWASM = !!options.wasm;

	if (options.sync === undefined) {
		options.sync = 'skip-frames';
	}

	var State = {
		INITIAL: 'INITIAL',
		SEEKING_END: 'SEEKING_END',
		LOADED: 'LOADED',
		PRELOAD: 'PRELOAD',
		READY: 'READY',
		PLAYING: 'PLAYING',
		SEEKING: 'SEEKING',
		ENDED: 'ENDED',
		ERROR: 'ERROR'
	}, state = State.INITIAL;

	var SeekState = {
		NOT_SEEKING: 'NOT_SEEKING',
		BISECT_TO_TARGET: 'BISECT_TO_TARGET',
		BISECT_TO_KEYPOINT: 'BISECT_TO_KEYPOINT',
		LINEAR_TO_TARGET: 'LINEAR_TO_TARGET'
	}, seekState = SeekState.NOT_SEEKING;

	var audioOptions = {},
		codecOptions = {};
	options.base = options.base || OGVLoader.base;
	if (typeof options.base === 'string') {
		// Pass the resource dir down to AudioFeeder, so it can load the dynamicaudio.swf
		audioOptions.base = options.base;

		// And to the worker thread, so it can load the codec JS
		codecOptions.base = options.base;
	}
	if (typeof options.audioContext !== 'undefined') {
		// Try passing a pre-created audioContext in?
		audioOptions.audioContext = options.audioContext;
	}
	if (typeof options.audioDestination !== 'undefined') {
		// Try passing a pre-created audioContext in?
		audioOptions.output = options.audioDestination;
	}
	// Buffer in largeish chunks to survive long CPU spikes on slow CPUs (eg, 32-bit iOS)
	audioOptions.bufferSize = 8192;

	codecOptions.worker = enableWorker;
	codecOptions.threading = enableThreading;
	codecOptions.wasm = enableWASM;
	if (typeof options.memoryLimit === 'number') {
		codecOptions.memoryLimit = options.memoryLimit;
	}

	var canvas = document.createElement('canvas');
	var frameSink;

	// Return a magical custom element!
	var self = document.createElement('ogvjs');
	self.className = instanceId;

	extend(self, constants);

	canvas.style.position = 'absolute';
	canvas.style.top = '0';
	canvas.style.left = '0';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.style.objectFit = 'contain';
	self.appendChild(canvas);

	var getTimestamp;
	// FIXME: don't use window scope, see BogoSlow.js
	if (window.performance === undefined || window.performance.now === undefined) {
		getTimestamp = Date.now;
	} else {
		getTimestamp = window.performance.now.bind(window.performance);
	}
	function time(cb) {
		var start = getTimestamp();
		cb();
		var delta = getTimestamp() - start;
		lastFrameDecodeTime += delta;
		return delta;
	}

	var then = getTimestamp();
	function log(msg) {
		if (options.debug) {
			var now = getTimestamp(),
				delta = now - then;

			//console.log('+' + delta + 'ms ' + msg);
			//then = now;
			
			if (!options.debugFilter || msg.match(options.debugFilter)) {
				console.log('[' + (Math.round(delta * 10) / 10) + 'ms] ' + msg);
			}
		}
	}

	function fireEvent(eventName, props) {
		log('fireEvent ' + eventName);
		var event;
		props = props || {};

		var standard = (typeof window.Event == 'function');
		if (standard) {
			// standard event creation
			event = new CustomEvent(eventName);
		} else {
			// IE back-compat mode
			// https://msdn.microsoft.com/en-us/library/dn905219%28v=vs.85%29.aspx
			event = document.createEvent('Event');
			event.initEvent(eventName, false, false);
		}

		for (var prop in props) {
			if (props.hasOwnProperty(prop)) {
				event[prop] = props[prop];
			}
		}

		var allowDefault = self.dispatchEvent(event);
		if (!standard && eventName === 'resize' && self.onresize && allowDefault) {
			// resize demands special treatment!
			// in IE 11 it doesn't fire through to the .onresize handler
			// for some crazy reason
			self.onresize.call(self, event);
		}
	}
	function fireEventAsync(eventName, props) {
		log('fireEventAsync ' + eventName);
		setTimeout(function() {
			fireEvent(eventName, props);
		}, 0);
	}

	var codec = null,
		videoInfo = null,
		audioInfo = null,
		actionQueue = [],
		audioFeeder = null;
	var muted = false,
		initialPlaybackPosition = 0.0,
		initialPlaybackOffset = 0.0,
		prebufferingAudio = false,
		stoppedForLateFrame = false,
		initialSeekTime = 0.0;
	function initAudioFeeder() {
		audioFeeder = new AudioFeeder( audioOptions );
		audioFeeder.init(audioInfo.channels, audioInfo.rate);

		// At our requested 8192 buffer size, bufferDuration should be
		// about 185ms at 44.1 kHz or 170ms at 48 kHz output, covering
		// 4-6 frames at 24-30fps.
		//
		// 2 or 3 buffers' worth will be in flight at any given time;
		// be warned that durationBuffered includes that in-flight stuff.
		//
		// Set our bufferThreshold to a full 1s for plenty of extra headroom,
		// and make sure we've queued up twice that when we're operating.
		audioFeeder.bufferThreshold = 1;

		audioFeeder.volume = self.volume;
		audioFeeder.muted = self.muted;

		// If we're in a background tab, timers may be throttled.
		// audioFeeder will call us when buffers need refilling,
		// without any throttling.
		audioFeeder.onbufferlow = function audioCallback() {
			log('onbufferlow');
			if ((stream && (stream.buffering || stream.seeking)) || pendingAudio) {
				// We're waiting on input or other async processing;
				// we'll get triggered later.
			} else {
				// We're in an async event so it's safe to run the loop:
				pingProcessing();
			}
		};

		// If we ran out of audio *completely* schedule some more processing.
		// This shouldn't happen if we keep up with onbufferlow, except at
		// the very beginning of playback when we haven't buffered any data yet.
		// @todo pre-buffer a little data to avoid needing this
		audioFeeder.onstarved = function () {
			if (dataEnded) {
				// Probably end of file.
				// Do nothing!
				log('onstarved: appear to have reached end of audio');
			} else {
				log('onstarved: halting audio due to starvation');
				stopPlayback();
				prebufferingAudio = true;
			}
			if (isProcessing()) {
				// We're waiting on input or other async processing;
				// we'll get triggered later.
			} else {
				// Schedule loop after this synchronous event.
				pingProcessing(0);
			}
		};
	}

	function startPlayback(offset) {
		if (audioFeeder) {
			audioFeeder.start();
			var state = audioFeeder.getPlaybackState();
			initialPlaybackPosition = state.playbackPosition;
		} else {
			initialPlaybackPosition = getTimestamp() / 1000;
		}
		if (offset !== undefined) {
			initialPlaybackOffset = offset;
		}
		// Clear the late flag if it was set.
		prebufferingAudio = false;
		stoppedForLateFrame = false;
		log('continuing at ' + initialPlaybackPosition + ', ' + initialPlaybackOffset);
	}

	function stopPlayback() {
		initialPlaybackOffset = getPlaybackTime();
		log('pausing at ' + initialPlaybackOffset);
		if (audioFeeder) {
			audioFeeder.stop();
		}
	}

	/**
	 * Get audio playback time position in file's units
	 *
	 * @return {number} seconds since file start
	 */
	function getPlaybackTime(state) {
		if (prebufferingAudio || stoppedForLateFrame || paused) {
			return initialPlaybackOffset;
		} else {
			var position;
			if (audioFeeder) {
				state = state || audioFeeder.getPlaybackState();
				position = state.playbackPosition;
			} else {
				// @fixme handle paused/stoped time better
				position = getTimestamp() / 1000;
			}
			return (position - initialPlaybackPosition) + initialPlaybackOffset;
		}
	}

	var currentSrc = '',
		stream,
		streamEnded = false,
		mediaError = null,
		dataEnded = false,
		byteLength = 0,
		duration = null,
		lastSeenTimestamp = null,
		nextProcessingTimer,
		nextFrameTimer = null,
		loading = false,
		started = false,
		paused = true,
		ended = false,
		startedPlaybackInDocument = false;

	var framesPlayed = 0;
	// Benchmark data, exposed via getPlaybackStats()
	var framesProcessed = 0, // frames
		targetPerFrameTime = 1000 / 60, // ms
		actualPerFrameTime = 0, // ms
		totalFrameTime = 0, // ms
		totalFrameCount = 0, // frames
		playTime = 0, // ms
		bufferTime = 0, // ms
		drawingTime = 0, // ms
		proxyTime = 0, // ms
		totalJitter = 0; // sum of ms we're off from expected frame delivery time
	// Benchmark data that doesn't clear
	var droppedAudio = 0, // number of times we were starved for audio
		delayedAudio = 0, // seconds audio processing was delayed by blocked CPU
		lateFrames = 0;   // number of times a frame was late and we had to halt audio
	var poster = '', thumbnail;

	// called when stopping old video on load()
	function stopVideo() {
		log("STOPPING");
		// kill the previous video if any
		state = State.INITIAL;
		seekState = SeekState.NOT_SEEKING;
		started = false;
		//paused = true; // don't change this?
		ended = false;
		frameEndTimestamp = 0.0;
		audioEndTimestamp = 0.0;
		lastFrameDecodeTime = 0.0;
		stoppedForLateFrame = false;
		prebufferingAudio = false;

		// Abort all queued actions
		actionQueue.splice(0, actionQueue.length);

		if (stream) {
			// @todo fire an abort event if still loading
			// @todo fire an emptied event if previously had data
			stream.abort();
			stream = null;
			streamEnded = false;
		}
		if (codec) {
			codec.close();
			codec = null;
			pendingFrame = 0;
			pendingAudio = 0;
			dataEnded = false;
		}
		videoInfo = null;
		audioInfo = null;
		if (audioFeeder) {
			audioFeeder.close();
			audioFeeder = null;
		}
		if (nextProcessingTimer) {
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
		}
		if (nextFrameTimer) {
			clearTimeout(nextFrameTimer);
			nextFrameTimer = null;
		}
		if (frameSink) {
			frameSink.clear();
			frameSink = null;
		}
		if (decodedFrames) {
			decodedFrames = [];
		}
		if (pendingFrames) {
			pendingFrames = [];
		}
		initialSeekTime = 0.0;
		// @todo set playback position, may need to fire timeupdate if wasnt previously 0
		initialPlaybackPosition = 0;
		initialPlaybackOffset = 0;
		duration = null; // do not fire durationchange
		// timeline offset to 0?
	}

	var lastFrameTime = getTimestamp(),
		frameEndTimestamp = 0.0,
		audioEndTimestamp = 0.0,
		decodedFrames = [],
		pendingFrames = [];
	var lastFrameDecodeTime = 0.0,
		lastFrameVideoCpuTime = 0,
		lastFrameAudioCpuTime = 0,
		lastFrameDemuxerCpuTime = 0,
		lastFrameDrawingTime = 0,
		lastFrameBufferTime = 0,
		lastFrameProxyTime = 0,
		lastVideoCpuTime = 0,
		lastAudioCpuTime = 0,
		lastDemuxerCpuTime = 0,
		lastBufferTime = 0,
		lastProxyTime = 0,
		lastDrawingTime = 0;
	var lastFrameTimestamp = 0.0,
		currentVideoCpuTime = 0.0;

	var lastTimeUpdate = 0, // ms
		timeUpdateInterval = 250; // ms

	function doFrameComplete(data) {
		data = data || {};

		if (startedPlaybackInDocument && !document.body.contains(self)) {
			// We've been de-parented since we last ran
			// Stop playback at next opportunity!
			setTimeout(function() {
				self.stop();
			}, 0);
		}

		var newFrameTimestamp = getTimestamp(),
			wallClockTime = newFrameTimestamp - lastFrameTimestamp,
			//jitter = wallClockTime - targetPerFrameTime;
			jitter = actualPerFrameTime - targetPerFrameTime;
		totalJitter += Math.abs(jitter);
		playTime += wallClockTime;

		var timing = {
			cpuTime: lastFrameDecodeTime,
			drawingTime: drawingTime - lastFrameDrawingTime,
			bufferTime: bufferTime - lastFrameBufferTime,
			proxyTime: proxyTime - lastFrameProxyTime,
			
			demuxerTime: 0,
			videoTime: 0,
			audioTime: 0,
			//clockTime: wallClockTime
			clockTime: actualPerFrameTime,

			late: stoppedForLateFrame || data.dropped,
			dropped: data.dropped
		};
		if (codec) {
			timing.demuxerTime = (codec.demuxerCpuTime - lastFrameDemuxerCpuTime);
			timing.videoTime += (currentVideoCpuTime - lastFrameVideoCpuTime);
			timing.audioTime += (codec.audioCpuTime - lastFrameAudioCpuTime);
		}
		timing.cpuTime += timing.demuxerTime;
		lastFrameDecodeTime = 0;
		lastFrameTimestamp = newFrameTimestamp;
		if (codec) {
			lastFrameVideoCpuTime = currentVideoCpuTime;
			lastFrameAudioCpuTime = codec.audioCpuTime;
			lastFrameDemuxerCpuTime = codec.demuxerCpuTime;
		} else {
			lastFrameVideoCpuTime = 0;
			lastFrameAudioCpuTime = 0;
			lastFrameDemuxerCpuTime = 0;
		}
		lastFrameDrawingTime = drawingTime;
		lastFrameBufferTime = bufferTime;
		lastFrameProxyTime = proxyTime;

		function n(x) {
			return Math.round(x * 10) / 10;
		}
		log('drew frame ' + data.frameEndTimestamp + ': ' +
			'clock time ' + n(wallClockTime) + ' (jitter ' + n(jitter) + ') ' +
			'cpu: ' + n(timing.cpuTime) + ' (mux: ' + n(timing.demuxerTime) + ' buf: ' + n(timing.bufferTime) + ' draw: ' + n(timing.drawingTime) + ' proxy: ' + n(timing.proxyTime) + ') ' +
			'vid: ' + n(timing.videoTime) + ' aud: ' + n(timing.audioTime));
		fireEventAsync('framecallback', timing);

		if (!lastTimeUpdate || (newFrameTimestamp - lastTimeUpdate) >= timeUpdateInterval) {
			lastTimeUpdate = newFrameTimestamp;
			fireEventAsync('timeupdate');
		}
	}


	// -- seek functions
	var seekTargetTime = 0.0,
		seekTargetKeypoint = 0.0,
		bisectTargetTime = 0.0,
		seekMode,
		lastSeekPosition,
		lastFrameSkipped,
		seekBisector,
		didSeek;

	var SeekMode = {
		EXACT: "exact",
		FAST: "fast"
	};

	function seekStream(offset) {
		if (stream.seeking) {
			stream.abort();
		}
		if (stream.buffering) {
			stream.abort();
		}
		streamEnded = false;
		dataEnded = false;
		ended = false;
		stream.seek(offset).then(function() {
			readBytesAndWait();
		}).catch(onStreamError);
	}

	function startBisection(targetTime) {
		// leave room for potentially long Ogg page syncing
		var endPoint = Math.max(0, stream.length - 65536);

		bisectTargetTime = targetTime;
		seekBisector = new Bisector({
			start: 0,
			end: endPoint,
			process: function(start, end, position) {
				if (position == lastSeekPosition) {
					return false;
				} else {
					lastSeekPosition = position;
					lastFrameSkipped = false;
					codec.flush(function() {
						seekStream(position);
					});
					return true;
				}
			}
		});
		seekBisector.start();
	}

	function seek(toTime, mode) {
		log('requested seek to ' + toTime + ', mode ' + mode);

		if (self.readyState == self.HAVE_NOTHING) {
			log('not yet loaded; saving seek position for later');
			initialSeekTime = toTime;
			return;
		}

		if (stream && !stream.seekable) {
			throw new Error('Cannot seek a non-seekable stream');
		}

		function prepForSeek(callback) {
			if (stream && stream.buffering) {
				stream.abort();
			}
			if (stream && stream.seeking) {
				stream.abort();
			}
			// clear any queued input/seek-start
			actionQueue.splice(0, actionQueue.length);
			stopPlayback();
			prebufferingAudio = false;
			stoppedForLateFrame = false;
			if (audioFeeder) {
				audioFeeder.flush();
			}
			state = State.SEEKING;
			seekTargetTime = toTime;
			seekMode = mode;
			if (codec) {
				codec.flush(callback);
			} else {
				callback();
			}
		}

		// Abort any previous seek or play suitably
		prepForSeek(function() {
			if (isProcessing()) {
				// already waiting on input
			} else {
				// start up the new load *after* event loop churn
				pingProcessing(0);
			}
		});

		actionQueue.push(function() {
			// Just in case another async task stopped us...
			prepForSeek(function() {
				doSeek(toTime)
			});
		});
	}

	function doSeek(toTime) {
		streamEnded = false;
		dataEnded = false;
		ended = false;
		state = State.SEEKING;
		seekTargetTime = toTime;
		seekTargetKeypoint = -1;
		lastFrameSkipped = false;
		lastSeekPosition = -1;

		decodedFrames = [];
		pendingFrames = [];
		pendingFrame = 0;
		pendingAudio = 0;

		didSeek = false;
		codec.seekToKeypoint(toTime, function(seeking) {
			if (seeking) {
				seekState = SeekState.LINEAR_TO_TARGET;
				fireEventAsync('seeking');

				if (didSeek) {
					// wait for i/o to trigger readBytesAndWait
					return;
				} else {
					pingProcessing();
					return;
				}
			}
			// Use the old interface still implemented on ogg demuxer
			codec.getKeypointOffset(toTime, function(offset) {
				if (offset > 0) {
					// This file has an index!
					//
					// Start at the keypoint, then decode forward to the desired time.
					//
					seekState = SeekState.LINEAR_TO_TARGET;
					seekStream(offset);
				} else {
					// No index.
					//
					// Bisect through the file finding our target time, then we'll
					// have to do it again to reach the keypoint, and *then* we'll
					// have to decode forward back to the desired time.
					//
					seekState = SeekState.BISECT_TO_TARGET;
					startBisection(seekTargetTime);
				}

				fireEventAsync('seeking');
			});
		});
	}

	function continueSeekedPlayback() {
		seekState = SeekState.NOT_SEEKING;
		state = State.READY;
		frameEndTimestamp = codec.frameTimestamp;
		audioEndTimestamp = codec.audioTimestamp;
		if (codec.hasAudio) {
			seekTargetTime = codec.audioTimestamp;
		} else {
			seekTargetTime = codec.frameTimestamp;
		}
		initialPlaybackOffset = seekTargetTime;

		function finishedSeeking() {
			lastTimeUpdate = seekTargetTime;
			fireEventAsync('timeupdate');
			fireEventAsync('seeked');
			if (isProcessing()) {
				// wait for whatever's going on to complete
			} else {
				pingProcessing();
			}
		}

		// Decode and show first frame immediately
		if (codec.hasVideo && codec.frameReady) {
			// hack! move this into the main loop when retooling
			// to avoid maintaining this double draw
			codec.decodeFrame(function(ok) {
				if (ok) {
					if (thumbnail) {
						self.removeChild(thumbnail);
						thumbnail = null;
					}
					frameSink.drawFrame(codec.frameBuffer);
				}
				finishedSeeking();
			} );
			return;
		} else {
			finishedSeeking();
		}
	}

	/**
	 * @return {boolean} true to continue processing, false to wait for input data
	 */
	function doProcessLinearSeeking() {
		var frameDuration;
		if (codec.hasVideo) {
			frameDuration = targetPerFrameTime / 1000;
		} else {
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		}

		if (codec.hasVideo) {
			if (pendingFrame) {
				// wait
				return;
			} else if (!codec.frameReady) {
				// Haven't found a frame yet, process more data
				codec.process(function(more) {
					if (more) {
						// need more packets
						pingProcessing();
					} else if (streamEnded) {
						log('stream ended during linear seeking on video');
						dataEnded = true;
						continueSeekedPlayback();
					} else {
						readBytesAndWait();
					}
				});
				return;
			} else if (seekMode === SeekMode.FAST && codec.keyframeTimestamp == codec.frameTimestamp) {
				// Found some frames? Go ahead now!
				continueSeekedPlayback();
				return;
			} else if (codec.frameTimestamp + frameDuration < seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time.
				// Decode it in case we're at our keyframe or a following intraframe...
				codec.decodeFrame(function() {
					pingProcessing();
				});
				return;
			} else {
				// Reached or surpassed the target time.
				if (codec.hasAudio) {
					// Keep processing the audio track
					// fall through...
				} else {
					continueSeekedPlayback();
					return;
				}
			}
		}
		if (codec.hasAudio) {
			if (pendingAudio) {
				// wait
				return;
			} if (!codec.audioReady) {
				// Haven't found an audio packet yet, process more data
				codec.process(function(more) {
					if (more) {
						// need more packets
						pingProcessing();
					} else if (streamEnded) {
						log('stream ended during linear seeking on audio');
						dataEnded = true;
						continueSeekedPlayback();
					} else {
						readBytesAndWait();
					}
				});
				return;
			} else if (codec.audioTimestamp + frameDuration < seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time.
				// Decode it so when we reach the target we've got consistent data.
				codec.decodeAudio(function() {
					pingProcessing();
				});
				return;
			} else {
				continueSeekedPlayback();
				return;
			}
		}
	}

	function doProcessBisectionSeek() {
		var frameDuration,
			timestamp;
		if (codec.hasVideo) {
			timestamp = codec.frameTimestamp;
			frameDuration = targetPerFrameTime / 1000;
		} else if (codec.hasAudio) {
			timestamp = codec.audioTimestamp;
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		} else {
			throw new Error('Invalid seek state; no audio or video track available');
		}

		if (timestamp < 0) {
			// Haven't found a packet yet.
			codec.process(function(more) {
				if (more) {
					// need more data
					pingProcessing();
				} else if (streamEnded) {
					log('stream ended during bisection seek');
					// We may have to go back further to find packets.
					if (seekBisector.right()) {
						// wait for new data to come in
					} else {
						log('failed going back');
						throw new Error('not sure what to do');
					}
				} else {
					readBytesAndWait();
				}
			});
		} else if (timestamp - frameDuration / 2 > bisectTargetTime) {
			if (seekBisector.left()) {
				// wait for new data to come in
			} else {
				log('close enough (left)');

				// We're having trouble finding a new packet position;
				// likely it's an audio file with lots of small packets.
				// Since we can't find an earlier packet, just continue here.
				seekTargetTime = timestamp;
				continueSeekedPlayback();
			}
		} else if (timestamp + frameDuration / 2 < bisectTargetTime) {
			if (seekBisector.right()) {
				// wait for new data to come in
			} else {
				log('close enough (right)');

				// We're having trouble finding a new packet position;
				// likely it's an audio file with lots of small packets.
				// Switch to linear mode to find the final target.
				seekState = SeekState.LINEAR_TO_TARGET;
				pingProcessing();
			}
		} else {
			// Reached the bisection target!
			if (seekState == SeekState.BISECT_TO_TARGET && (codec.hasVideo && codec.keyframeTimestamp < codec.frameTimestamp)) {
				// We have to go back and find a keyframe. Sigh.
				log('finding the keypoint now');
				seekState = SeekState.BISECT_TO_KEYPOINT;
				startBisection(codec.keyframeTimestamp);
			} else {
				log('straight seeking now');
				// Switch to linear mode to find the final target.
				seekState = SeekState.LINEAR_TO_TARGET;
				pingProcessing();
			}
		}
	}

	function setupVideo() {
		if (videoInfo.fps > 0) {
			targetPerFrameTime = 1000 / videoInfo.fps;
		} else {
			targetPerFrameTime = 16.667; // recalc this later
		}

		canvas.width = videoInfo.displayWidth;
		canvas.height = videoInfo.displayHeight;
		OGVPlayer.styleManager.appendRule('.' + instanceId, {
			width: videoInfo.displayWidth + 'px',
			height: videoInfo.displayHeight + 'px'
		});
		OGVPlayer.updatePositionOnResize();

		frameSink = YUVCanvas.attach(canvas, canvasOptions);
	}

	var depth = 0,
		needProcessing = false,
		pendingFrame = 0,
		pendingAudio = 0,
		framePipelineDepth = 3,
		audioPipelineDepth = 4;

	function doProcessing() {
		if (didSeek) {
			didSeek = false;
		}
		nextProcessingTimer = null;

		if (isProcessing()) {
			// Called async while waiting for something else to complete...
			// let it finish, then we'll get called again to continue.
			//return;
			//throw new Error('REENTRANCY FAIL: doProcessing during processing');
		}

		if (depth > 0) {
			throw new Error('REENTRANCY FAIL: doProcessing recursing unexpectedly');
		}
		var iters = 0;
		do {
			needProcessing = false;
			depth++;
			doProcessingLoop();
			depth--;
			
			if (needProcessing && isProcessing()) {
				throw new Error('REENTRANCY FAIL: waiting on input or codec but asked to keep processing');
			}
			if (++iters > 500) {
				log('stuck in processing loop; breaking with timer');
				needProcessing = 0;
				pingProcessing(0);
			}
		} while (needProcessing);
	}

	function doProcessingLoop() {

		if (actionQueue.length) {
			// data or user i/o to process in our serialized event stream
			// The function should eventually bring us back here via pingProcessing(),
			// directly or via further i/o.

			var action = actionQueue.shift();
			action();

		} else if (state == State.INITIAL) {

			if (codec.loadedMetadata) {
				// we just fell over from headers into content; call onloadedmetadata etc
				if (!codec.hasVideo && !codec.hasAudio) {
					throw new Error('No audio or video found, something is wrong');
				}
				if (codec.hasAudio) {
					audioInfo = codec.audioFormat;
				}
				if (codec.hasVideo) {
					videoInfo = codec.videoFormat;
					setupVideo();
				}
				if (!isNaN(codec.duration)) {
					duration = codec.duration;
				}
				if (duration === null) {
					if (stream.seekable) {
						state = State.SEEKING_END;
						lastSeenTimestamp = -1;
						codec.flush(function() {
							seekStream(Math.max(0, stream.length - 65536 * 2));
						});
					} else {
						// Stream not seekable and no x-content-duration; assuming infinite stream.
						state = State.LOADED;
						pingProcessing();
					}
				} else {
					// We already know the duration.
					state = State.LOADED;
					pingProcessing();
				}
			} else {
				codec.process(function processInitial(more) {
					if (more) {
						// Keep processing headers
						pingProcessing();
					} else if (streamEnded) {
						throw new Error('end of file before headers found');
					} else {
						// Read more data!
						log('reading more cause we are out of data');
						readBytesAndWait();
					}
				});
			}

		} else if (state == State.SEEKING_END) {

			// Look for the last item.
			if (codec.frameReady) {
				log('saw frame with ' + codec.frameTimestamp);
				lastSeenTimestamp = Math.max(lastSeenTimestamp, codec.frameTimestamp);
				codec.discardFrame(function() {
					pingProcessing();
				});
			} else if (codec.audioReady) {
				log('saw audio with ' + codec.audioTimestamp);
				lastSeenTimestamp = Math.max(lastSeenTimestamp, codec.audioTimestamp);
				codec.discardAudio(function() {
					pingProcessing();
				});
			} else {
				codec.process(function processSeekingEnd(more) {
					if (more) {
						// Keep processing headers
						pingProcessing();
					} else {
						// Read more data!
						if (!stream.eof) {
							readBytesAndWait();
						} else {
							// We are at the end!
							log('seek-duration: we are at the end: ' + lastSeenTimestamp);
							if (lastSeenTimestamp > 0) {
								duration = lastSeenTimestamp;
							}

							// Ok, seek back to the beginning and resync the streams.
							state = State.LOADED;
							codec.flush(function() {
								streamEnded = false;
								dataEnded = false;
								seekStream(0);
							});
						}
					}
				});
			}

		} else if (state == State.LOADED) {

			state = State.PRELOAD;
			fireEventAsync('loadedmetadata');
			fireEventAsync('durationchange');
			if (codec.hasVideo) {
				fireEventAsync('resize');
			}
			pingProcessing(0);

		} else if (state == State.PRELOAD) {

			if ((codec.frameReady || !codec.hasVideo) &&
			    (codec.audioReady || !codec.hasAudio)) {

				state = State.READY;
				fireEventAsync('loadeddata');
				pingProcessing();
			} else {
				codec.process(function doProcessPreload(more) {
					if (more) {
						pingProcessing();
					} else if (streamEnded) {
						// Ran out of data before data available...?
						ended = true;
					} else {
						readBytesAndWait();
					}
				});
			}

		} else if (state == State.READY) {
			log('initial seek to ' + initialSeekTime);

			if (initialSeekTime > 0) {

				var target = initialSeekTime;
				initialSeekTime = 0;
				log('initial seek to ' + target);
				doSeek(target);

			} else if (paused) {

				// Paused? stop here.
				log('paused while in ready');

			} else {

				function finishStartPlaying() {
					log('finishStartPlaying');

					state = State.PLAYING;
					lastFrameTimestamp = getTimestamp();

					if (codec.hasAudio && audioFeeder) {
						// Pre-queue audio before we start the clock
						prebufferingAudio = true;
					} else {
						startPlayback();
					}
					pingProcessing(0);
					fireEventAsync('play');
					fireEventAsync('playing');
				}

				if (codec.hasAudio && !audioFeeder && !muted) {
					initAudioFeeder();
					audioFeeder.waitUntilReady(finishStartPlaying);
				} else {
					finishStartPlaying();
				}
			}

		} else if (state == State.SEEKING) {

			if (seekState == SeekState.NOT_SEEKING) {
				throw new Error('seeking in invalid state (not seeking?)');
			} else if (seekState == SeekState.BISECT_TO_TARGET) {
				doProcessBisectionSeek();
			} else if (seekState == SeekState.BISECT_TO_KEYPOINT) {
				doProcessBisectionSeek();
			} else if (seekState == SeekState.LINEAR_TO_TARGET) {
				doProcessLinearSeeking();
			} else {
				throw new Error('Invalid seek state ' + seekState);
			}

		} else if (state == State.PLAYING) {

			function doProcessPlay() {

				//console.log(more, codec.audioReady, codec.frameReady, codec.audioTimestamp, codec.frameTimestamp);

				if (paused) {

					// ok we're done for now!
					log('paused during playback; stopping loop');

				} else {

					if ((!codec.hasAudio || codec.audioReady || pendingAudio || dataEnded) &&
						(!codec.hasVideo || codec.frameReady || pendingFrame || decodedFrames.length || dataEnded)
					) {

						var audioState = null,
							playbackPosition = 0,
							readyForAudioDecode,
							audioEnded = false,
							readyForFrameDraw,
							frameDelay = 0,
							readyForFrameDecode,
							// timers never fire earlier than 4ms
							timerMinimum = 4,
							// ok to draw a couple ms early
							fudgeDelta = timerMinimum;


						if (codec.hasAudio && audioFeeder) {
							// Drive on the audio clock!

							audioState = audioFeeder.getPlaybackState();
							playbackPosition = getPlaybackTime(audioState);
							audioEnded = (dataEnded && audioFeeder.durationBuffered == 0);

							if (prebufferingAudio && (audioFeeder.durationBuffered >= audioFeeder.bufferThreshold * 2 || dataEnded)) {
								log('prebuffering audio done; buffered to ' + audioFeeder.durationBuffered);
								startPlayback(playbackPosition);
								prebufferingAudio = false;
							}

							if (audioState.dropped != droppedAudio) {
								log('dropped ' + (audioState.dropped - droppedAudio));
							}
							if (audioState.delayed != delayedAudio) {
								log('delayed ' + (audioState.delayed - delayedAudio));
							}
							droppedAudio = audioState.dropped;
							delayedAudio = audioState.delayed;
							
							readyForAudioDecode = audioFeeder.durationBuffered <=
								audioFeeder.bufferThreshold * 2;

							if (!readyForAudioDecode) {
								// just to skip the remaining items in debug log
							} else if (!codec.audioReady) {
								// NEED MOAR BUFFERS
								readyForAudioDecode = false;
							} else if (pendingAudio >= audioPipelineDepth) {
								// We'll check in when done decoding
								log('audio decode disabled: ' + pendingAudio + ' packets in flight');
								readyForAudioDecode = false;
							}

						} else {
							// No audio; drive on the general clock.
							// @fixme account for dropped frame times...
							playbackPosition = getPlaybackTime();

							// If playing muted with no audio output device,
							// just keep up with audio in general.
							readyForAudioDecode = codec.audioReady && (audioEndTimestamp < playbackPosition);
						}

						if (codec.hasVideo) {
							readyForFrameDraw = decodedFrames.length > 0;
							readyForFrameDecode = (pendingFrame + decodedFrames.length < framePipelineDepth) && codec.frameReady;

							if (readyForFrameDraw) {
								frameDelay = (decodedFrames[0].frameEndTimestamp - playbackPosition) * 1000;
								actualPerFrameTime = targetPerFrameTime - frameDelay;
								//frameDelay = Math.max(0, frameDelay);
								//frameDelay = Math.min(frameDelay, targetPerFrameTime);
							}

							var audioSyncThreshold = targetPerFrameTime;
							if (prebufferingAudio) {
								if (readyForFrameDecode) {
									log('decoding a frame during prebuffering');
								}
								readyForFrameDraw = false;
							} else if (readyForFrameDraw && dataEnded && audioEnded) {
								// If audio timeline reached end, make sure the last frame draws
								log('audio timeline ended? ready to draw frame');
							} else if (readyForFrameDraw && -frameDelay >= audioSyncThreshold) {
								// late frame!
								if (options.sync == 'delay-audio') {
									// Delay audio while video catches up. Old default.
									if (!stoppedForLateFrame) {
										log('late frame at ' + playbackPosition + ': ' + (-frameDelay) + ' expected ' + audioSyncThreshold);
										lateFrames++;
										if (decodedFrames.length > 1) {
											log('late frame has a neighbor; skipping to next frame');
											var frame = decodedFrames.shift();
											frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
											actualPerFrameTime = targetPerFrameTime - frameDelay;
											framesProcessed++; // pretend!
											doFrameComplete({
												frameEndTimestamp: frame.frameEndTimestamp,
												dropped: true
											});
										} else {
											stopPlayback();
											stoppedForLateFrame = true;
										}
									}
								} else if (options.sync == 'skip-frames') {
									var skipPast = -1;
									for (var i = 0; i < decodedFrames.length - 1; i++) {
										if (decodedFrames[i].frameEndTimestamp < playbackPosition) {
											skipPast = i - 1;
										}
									}
									if (skipPast >= 0) {
										while (skipPast-- >= 0) {
											lateFrames++;
											var frame = decodedFrames.shift();
											log('skipping already-decoded late frame at ' + frame.frameEndTimestamp);
											frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
											frameEndTimestamp = frame.frameEndTimestamp;
											actualPerFrameTime = targetPerFrameTime - frameDelay;
											framesProcessed++; // pretend!
											frame.dropped = true;
											doFrameComplete();
										}
									}

									// Resync at the next keyframe. Default as of 1.3.2.
									var nextKeyframe = codec.nextKeyframeTimestamp;

									// When resyncing, allow time to decode a couple frames!
									var videoSyncPadding = (targetPerFrameTime / 1000) * (framePipelineDepth + pendingFrame);
									var timeToResync = nextKeyframe - videoSyncPadding;

									if (nextKeyframe >= 0 && nextKeyframe != codec.frameTimestamp && playbackPosition  >= timeToResync) {
										log('skipping late frame at ' + decodedFrames[0].frameEndTimestamp + ' vs ' + playbackPosition + ', expect to see keyframe at ' + nextKeyframe);

										// First skip any already-decoded frames
										for (var i = 0; i < decodedFrames.length; i++) {
											var frame = decodedFrames[i];
											lateFrames++;
											framesProcessed++; // pretend!
											frameEndTimestamp = frame.frameEndTimestamp;
											frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
											actualPerFrameTime = targetPerFrameTime - frameDelay;
											frame.dropped = true;
											doFrameComplete(frame);
										}
										decodedFrames = [];
										for (var i = 0; i < pendingFrames.length; i++) {
											var frame = pendingFrames[i];
											lateFrames++;
											framesProcessed++; // pretend!
											frameEndTimestamp = frame.frameEndTimestamp;
											frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
											actualPerFrameTime = targetPerFrameTime - frameDelay;
											frame.dropped = true;
											doFrameComplete(frame);
										}
										pendingFrames = [];
										pendingFrame = 0;

										// Now discard anything up to the keyframe
										while (codec.frameReady && codec.frameTimestamp < nextKeyframe) {
											// note: this is a known synchronous operation :)
											var frame = {
												frameEndTimestamp: codec.frameTimestamp,
												dropped: true
											};
											frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
											actualPerFrameTime = targetPerFrameTime - frameDelay;
											lateFrames++;
											codec.discardFrame(function() {/*fake*/});
											framesProcessed++; // pretend!
											doFrameComplete(frame);
										}
										if (isProcessing()) {
											// wait
										} else {
											pingProcessing();
										}
										return;
									}
								}
							} else if (readyForFrameDraw && stoppedForLateFrame && !readyForFrameDecode && !readyForAudioDecode && frameDelay > fudgeDelta) {
								// catching up, ok if we were early
								log('late frame recovery reached ' + frameDelay);
								startPlayback(playbackPosition);
								stoppedForLateFrame = false;
								readyForFrameDraw = false; // go back through the loop again
							} else if (readyForFrameDraw && stoppedForLateFrame) {
								// draw asap
							} else if (readyForFrameDraw && frameDelay <= fudgeDelta) {
								// on time! draw
							} else {
								// not yet
								readyForFrameDraw = false;
							}
						}

						if (readyForFrameDecode) {

							log('play loop: ready to decode frame; thread depth: ' + pendingFrame + ', have buffered: ' + decodedFrames.length);

							if (videoInfo.fps == 0 && (codec.frameTimestamp - frameEndTimestamp) > 0) {
								// WebM doesn't encode a frame rate
								targetPerFrameTime = (codec.frameTimestamp - frameEndTimestamp) * 1000;
							}
							totalFrameTime += targetPerFrameTime;
							totalFrameCount++;
							
							var nextFrameEndTimestamp = frameEndTimestamp = codec.frameTimestamp;
							pendingFrame++;
							pendingFrames.push({
								frameEndTimestamp: nextFrameEndTimestamp
							});
							var currentPendingFrames = pendingFrames;
							var wasAsync = false;
							var frameDecodeTime = time(function() {
								codec.decodeFrame(function processingDecodeFrame(ok) {
									if (currentPendingFrames !== pendingFrames) {
										log('play loop callback after flush, discarding');
										return;
									}
									log('play loop callback: decoded frame');
									pendingFrame--;
									pendingFrames.shift();
									if (ok) {
										// Save the buffer until it's time to draw
										decodedFrames.push({
											yCbCrBuffer: codec.frameBuffer,
											videoCpuTime: codec.videoCpuTime,
											frameEndTimestamp: nextFrameEndTimestamp
										});
									} else {
										// Bad packet or something.
										log('Bad video packet or something');
									}
									codec.process(function() {
										if (isProcessing()) {
											// wait
										} else {
											pingProcessing(wasAsync ? undefined : 0);
										}
									});
								});
							});
							if (pendingFrame) {
								wasAsync = true;
								proxyTime += frameDecodeTime;
								// We can process something else while that's running
								pingProcessing();
							}

						} else if (readyForAudioDecode) {

							log('play loop: ready for audio; depth: ' + pendingAudio);

							pendingAudio++;
							var nextAudioEndTimestamp = codec.audioTimestamp;
							var audioDecodeTime = time(function() {
								codec.decodeAudio(function processingDecodeAudio(ok) {
									pendingAudio--;
									log('play loop callback: decoded audio');
									audioEndTimestamp = nextAudioEndTimestamp;

									if (ok) {
										var buffer = codec.audioBuffer;
										if (buffer) {
											// Keep track of how much time we spend queueing audio as well
											// This is slow when using the Flash shim on IE 10/11
											bufferTime += time(function() {
												if (audioFeeder) {
													audioFeeder.bufferData(buffer);
												}
											});
											if (!codec.hasVideo) {
												framesProcessed++; // pretend!
												var frame = {
													frameEndTimestamp: audioEndTimestamp
												};
												doFrameComplete(frame);
											}
										}
									}
									if (isProcessing()) {
										// wait
									} else {
										pingProcessing();
									}
								});
							});
							if (pendingAudio) {
								proxyTime += audioDecodeTime;
								// We can process something else while that's running
								if (codec.audioReady) {
									pingProcessing();
								} else {
									// Trigger a demux immediately if we need it;
									// audio processing is our mostly-idle time
									doProcessPlayDemux();
								}
							}

						} else if (readyForFrameDraw) {

							log('play loop: ready to draw frame');

							if (nextFrameTimer) {
								clearTimeout(nextFrameTimer);
								nextFrameTimer = null;
							}

							// Ready to draw the decoded frame...
							if (thumbnail) {
								self.removeChild(thumbnail);
								thumbnail = null;
							}

							var frame = decodedFrames.shift();
							currentVideoCpuTime = frame.videoCpuTime;

							drawingTime += time(function() {
								frameSink.drawFrame(frame.yCbCrBuffer);
							});

							framesProcessed++;
							framesPlayed++;

							doFrameComplete(frame);

							pingProcessing();

						} else if (decodedFrames.length && !nextFrameTimer && !prebufferingAudio) {

							var targetTimer = frameDelay;
							// @todo consider using requestAnimationFrame
							log('play loop: setting a timer for drawing ' + targetTimer);
							nextFrameTimer = setTimeout(function() {
								nextFrameTimer = null;
								pingProcessing();
							}, targetTimer);

						} else if (dataEnded && !(pendingAudio || pendingFrame || decodedFrames.length)) {
							log('play loop: playback reached end of data ' + [pendingAudio, pendingFrame, decodedFrames.length]);
							var finalDelay = 0;
							if (codec.hasAudio && audioFeeder) {
								finalDelay = audioFeeder.durationBuffered * 1000;
							}
							if (finalDelay > 0) {
								log('play loop: ending pending ' + finalDelay + ' ms');
								pingProcessing(Math.max(0, finalDelay));
							} else {
								log('play loop: ENDING NOW: playback time ' + getPlaybackTime() + '; frameEndTimestamp: ' + frameEndTimestamp);
								stopPlayback();
								stoppedForLateFrame = false;
								prebufferingAudio = false;
								initialPlaybackOffset = Math.max(audioEndTimestamp, frameEndTimestamp);
								ended = true;
								// @todo implement loop behavior
								paused = true;
								fireEventAsync('pause');
								fireEventAsync('ended');
							}

						} else {

							log('play loop: waiting on async/timers');

						}

					} else {

						log('play loop: demuxing');

						doProcessPlayDemux();
					}
				}
			}
			
			function doProcessPlayDemux() {
				var wasFrameReady = codec.frameReady,
					wasAudioReady = codec.audioReady;
				codec.process(function doProcessPlayDemuxHandler(more) {
					if ((codec.frameReady && !wasFrameReady) || (codec.audioReady && !wasAudioReady)) {
						log('demuxer has packets');
						pingProcessing();
					} else if (more) {
						// Have to process some more pages to find data.
						log('demuxer processing to find more packets');
						pingProcessing();
					} else {
						log('demuxer ran out of data');
						if (!streamEnded) {
							// Ran out of buffered input
							log('demuxer loading more data');
							readBytesAndWait();
						} else {
							// Ran out of stream!
							log('demuxer reached end of data stream');
							dataEnded = true;
							pingProcessing();
						}
					}
				});
			}

			doProcessPlay();

		} else if (state == State.ERROR) {

			// Nothing to do.
			console.log("Reached error state. Sorry bout that.");

		} else {

			throw new Error('Unexpected OGVPlayer state ' + state);

		}
	}

	/**
	 * Are we waiting on an async operation that will return later?
	 */
	function isProcessing() {
		return (stream && (stream.buffering || stream.seeking)) || (codec && codec.processing);
	}

	function readBytesAndWait() {
		if (stream.buffering || stream.seeking) {
			log('readBytesAndWait during i/o');
			return;
		}
		// keep i/o size small to reduce CPU impact of demuxing on slow machines
		// @todo make buffer size larger when packets are larger?
		var bufferSize = 32768;
		stream.read(bufferSize).then(function(data) {
			log('got input ' + [data.byteLength]);

			if (data.byteLength) {
				// Save chunk to pass into the codec's buffer
				actionQueue.push(function doReceiveInput() {
					codec.receiveInput(data, function() {
						pingProcessing();
					});
				});
			}
			if (stream.eof) {
				// @todo record doneness in networkState
				log('stream is at end!');
				streamEnded = true;
			}
			if (isProcessing()) {
				// We're waiting on the codec already...
			} else {
				// Let the read/decode/draw loop know we're out!
				pingProcessing();
			}
		}).catch(onStreamError);
	}

	function onStreamError(err) {
		if (err.name === 'AbortError') {
			// do nothing
			log('i/o promise canceled; ignoring');
		} else {
			log("i/o error: " + err);
			mediaError = new OGVMediaError(OGVMediaError.MEDIA_ERR_NETWORK, '' + err);
			state = State.ERROR;
			stopPlayback();
		}
	}

	function pingProcessing(delay) {
		if (delay === undefined) {
			delay = -1;
		}
		/*
		if (isProcessing()) {
			// We'll get pinged again when whatever we were doing returns...
			log('REENTRANCY FAIL: asked to pingProcessing() while already waiting');
			return;
		}
		*/
		if (stream && stream.waiting) {
			// wait for this input pls
			log('waiting on input');
			return;
		}
		if (nextProcessingTimer) {
			log('canceling old processing timer');
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
		}
		var fudge = -1 / 256;
		if (delay > fudge) {
			//log('pingProcessing delay: ' + delay);
			nextProcessingTimer = setTimeout(function() {
				// run through pingProcessing again to check
				// in case some io started asynchronously in the meantime
				pingProcessing();
			}, delay);
		} else if (depth) {
			//log('pingProcessing tail call (' + delay + ')');
			needProcessing = true;
		} else {
			doProcessing();
		}
	}

	var videoInfo,
		audioInfo;

	function startProcessingVideo() {
		if (started || codec) {
			return;
		}

		framesProcessed = 0;
		bufferTime = 0;
		drawingTime = 0;
		proxyTime = 0;
		started = true;
		ended = false;

		codec = new codecClass(codecOptions);
		lastVideoCpuTime = 0;
		lastAudioCpuTime = 0;
		lastDemuxerCpuTime = 0;
		lastBufferTime = 0;
		lastDrawingTime = 0;
		lastProxyTime = 0;
		lastFrameVideoCpuTime = 0;
		lastFrameAudioCpuTime = 0;
		lastFrameDemuxerCpuTime = 0;
		lastFrameBufferTime = 0;
		lastFrameProxyTime = 0;
		lastFrameDrawingTime = 0;
		currentVideoCpuTime = 0;
		codec.onseek = function(offset) {
			didSeek = true;
			if (stream) {
				seekStream(offset);
			}
		};
		codec.init(function() {
			readBytesAndWait();
		});
	}

	function loadCodec(callback) {
		// @todo use the demuxer and codec interfaces directly

		// @todo fix detection proper
		if (enableWebM && currentSrc.match(/\.webm$/i)) {
			codecOptions.type = 'video/webm';
		} else {
			codecOptions.type = 'video/ogg';
		}

		codecClass = OGVWrapperCodec;
		callback();
	}

	/**
	 * HTMLMediaElement load method
	 *
	 * https://www.w3.org/TR/html5/embedded-content-0.html#concept-media-load-algorithm
	 */
	self.load = function() {
		prepForLoad();
	};

	function prepForLoad(preload) {
		stopVideo();

		function doLoad() {
			// @todo networkState == NETWORK_LOADING
			stream = new StreamFile({
				url: self.src,
				cacheSize: 16 * 1024 * 1024,
			});
			stream.load().then(function() {
				loading = false;

				// @todo handle failure / unrecognized type

				currentSrc = self.src;

				// Fire off the read/decode/draw loop...
				byteLength = stream.seekable ? stream.length : 0;

				// If we get X-Content-Duration, that's as good as an explicit hint
				var durationHeader = stream.headers['x-content-duration'];
				if (typeof durationHeader === 'string') {
					duration = parseFloat(durationHeader);
				}
				loadCodec(startProcessingVideo);
			}).catch(onStreamError);
		}

		// @todo networkState = self.NETWORK_NO_SOURCE;
		// @todo show poster
		// @todo set 'delay load event flag'

		currentSrc = '';
		loading = true;
		actionQueue.push(function() {
			if (preload && self.preload === 'none') {
				// Done for now, we'll pick up if someone hits play() or load()
				loading = false;
			} else {
				doLoad();
			}
		});
		pingProcessing(0);
	}

	/**
	 * HTMLMediaElement canPlayType method
	 */
	self.canPlayType = function(contentType) {
		var type = new OGVMediaType(contentType);
		if (type.minor === 'ogg' &&
			(type.major === 'audio' || type.major === 'video' || type.major === 'application')) {
			if (type.codecs) {
				var supported = ['vorbis', 'opus', 'theora'],
					knownCodecs = 0,
					unknownCodecs = 0;
				type.codecs.forEach(function(codec) {
					if (supported.indexOf(codec) >= 0) {
						knownCodecs++;
					} else {
						unknownCodecs++;
					}
				});
				if (knownCodecs === 0) {
					return '';
				} else if (unknownCodecs > 0) {
					return '';
				}
				// All listed codecs are ones we know. Neat!
				return 'probably';
			} else {
				return 'maybe';
			}
		} else {
			// @todo when webm support is more complete, handle it
			return '';
		}
	};

	/**
	 * HTMLMediaElement play method
	 */
	self.play = function() {
		if (!muted && !audioOptions.audioContext) {
			OGVPlayer.initSharedAudioContext();
		}

		if (paused) {
			startedPlaybackInDocument = document.body.contains(self);

			paused = false;

			if (state == State.SEEKING) {

				// Seeking? Just make sure we know to pick up after.

			} else if (started && codec && codec.loadedMetadata) {

				if (ended && stream && byteLength) {

					log('.play() starting over after end');
					seek(0);

				} else {
					log('.play() while already started');
				}

				state = State.READY;
				if (isProcessing()) {
					// waiting on the codec already
				} else {
					pingProcessing();
				}

			} else if (loading) {

				log('.play() while loading');

			} else {

				log('.play() before started');

				// Let playback begin when metadata loading is complete
				if (!stream) {
					self.load();
				}

			}
		}
	};

	/**
	 * custom getPlaybackStats method
	 */
	self.getPlaybackStats = function() {
		return {
			targetPerFrameTime: targetPerFrameTime,
			framesProcessed: framesProcessed,
			playTime: playTime,
			demuxingTime: codec ? (codec.demuxerCpuTime - lastDemuxerCpuTime) : 0,
			videoDecodingTime: codec ? (codec.videoCpuTime - lastVideoCpuTime) : 0,
			audioDecodingTime: codec ? (codec.audioCpuTime - lastAudioCpuTime) : 0,
			bufferTime: bufferTime - lastBufferTime,
			drawingTime: drawingTime - lastDrawingTime,
			proxyTime: proxyTime - lastProxyTime,
			droppedAudio: droppedAudio,
			delayedAudio: delayedAudio,
			jitter: totalJitter / framesProcessed,
			lateFrames: lateFrames
		};
	};
	self.resetPlaybackStats = function() {
		framesProcessed = 0;
		playTime = 0;
		if (codec) {
			lastDemuxerCpuTime = codec.demuxerCpuTime;
			lastVideoCpuTime = codec.videoCpuTime;
			lastAudioCpuTime = codec.audioCpuTime;
		}
		lastBufferTime = bufferTime;
		lastDrawingTime = drawingTime;
		lastProxyTime = proxyTime;
		totalJitter = 0;
		totalFrameTime = 0;
		totalFrameCount = 0;
	};

	self.getVideoFrameSink = function() {
		return frameSink;
	};

	self.getCanvas = function() {
		return canvas;
	};

	/**
	 * HTMLMediaElement pause method
	 */
	self.pause = function() {
		if (!paused) {
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
			stopPlayback();
			prebufferingAudio = false;
			stoppedForLateFrame = false;
			paused = true;
			fireEvent('pause');
		}
	};

	/**
	 * custom 'stop' method
	 */
	self.stop = function() {
		stopVideo();
		paused = true;
	};

	/**
	 * @todo implement the fast part of the behavior!
	 */
	self.fastSeek = function(seekToTime) {
		seek(+seekToTime, SeekMode.FAST);
	};

	/**
	 * HTMLMediaElement src property
	 */
	Object.defineProperty(self, "src", {
		get: function getSrc() {
			return self.getAttribute('src') || '';
		},
		set: function setSrc(val) {
			self.setAttribute('src', val);
			loading = false; // just in case?
			prepForLoad("interactive");
		}
	});

	/**
	 * HTMLMediaElement buffered property
	 */
	Object.defineProperty(self, "buffered", {
		get: function getBuffered() {
			var ranges;
			if (stream && byteLength && duration) {
				ranges = stream.getBufferedRanges().map(function(range) {
					return range.map(function(offset) {
						return (offset / stream.length) * duration;
					});
				});
			} else {
				ranges = [[0, 0]];
			}
			return new OGVTimeRanges(ranges);
		}
	});

	/**
	 * HTMLMediaElement seekable property
	 */
	Object.defineProperty(self, "seekable", {
		get: function getSeekable() {
			if (self.duration < Infinity && stream && stream.seekable && codec && codec.seekable) {
				return new OGVTimeRanges([[0, duration]]);
			} else {
				return new OGVTimeRanges([]);
			}
		}
	});

	/**
	 * HTMLMediaElement currentTime property
	 */
	Object.defineProperty(self, "currentTime", {
		get: function getCurrentTime() {
			if (state == State.SEEKING) {
				return seekTargetTime;
			} else {
				if (codec) {
					if (state == State.PLAYING && !paused) {
						return getPlaybackTime();
					} else {
						return initialPlaybackOffset;
					}
				} else {
					return initialSeekTime;
				}
			}
		},
		set: function setCurrentTime(val) {
			seek(val, SeekMode.EXACT);
		}
	});

	/**
	 * HTMLMediaElement duration property
	 */
	Object.defineProperty(self, "duration", {
		get: function getDuration() {
			if (codec && codec.loadedMetadata) {
				if (duration !== null) {
					return duration;
				} else {
					return Infinity;
				}
			} else {
				return NaN;
			}
		}
	});

	/**
	 * HTMLMediaElement paused property
	 */
	Object.defineProperty(self, "paused", {
		get: function getPaused() {
			return paused;
		}
	});

	/**
	 * HTMLMediaElement ended property
	 */
	Object.defineProperty(self, "ended", {
		get: function getEnded() {
			return ended;
		}
	});

	/**
	 * HTMLMediaElement ended property
	 */
	Object.defineProperty(self, "seeking", {
		get: function getSeeking() {
			return (state == State.SEEKING);
		}
	});

	/**
	 * HTMLMediaElement muted property
	 */
	Object.defineProperty(self, "muted", {
		get: function getMuted() {
			return muted;
		},
		set: function setMuted(val) {
			muted = val;
			if (audioFeeder) {
				audioFeeder.muted = muted;
			} else if (started && !muted && codec && codec.hasAudio) {
				log('unmuting: switching from timer to audio clock');
				initAudioFeeder();
				startPlayback(audioEndTimestamp);
			}
			fireEventAsync('volumechange');
		}
	});

	Object.defineProperty(self, "poster", {
		get: function getPoster() {
			return poster;
		},
		set: function setPoster(val) {
			poster = val;
			if (!started) {
				if (thumbnail) {
					self.removeChild(thumbnail);
				}
				thumbnail = new Image();
				thumbnail.src = poster;
				thumbnail.className = 'ogvjs-poster';
				thumbnail.style.position = 'absolute';
				thumbnail.style.top = '0';
				thumbnail.style.left = '0';
				thumbnail.style.width = '100%';
				thumbnail.style.height = '100%';
				thumbnail.style.objectFit = 'contain';
				thumbnail.style.visibility = 'hidden';
				thumbnail.addEventListener('load', function() {
					if (thumbnail === this) {
						OGVPlayer.styleManager.appendRule('.' + instanceId, {
							width: thumbnail.naturalWidth + 'px',
							height: thumbnail.naturalHeight + 'px'
						});
						OGVPlayer.updatePositionOnResize();
						thumbnail.style.visibility = 'visible';
					}
				});
				self.appendChild(thumbnail);
			}
		}
	});

	// Video metadata properties...
	Object.defineProperty(self, "videoWidth", {
		get: function getVideoWidth() {
			if (videoInfo) {
				return videoInfo.displayWidth;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "videoHeight", {
		get: function getVideoHeight() {
			if (videoInfo) {
				return videoInfo.displayHeight;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "ogvjsVideoFrameRate", {
		get: function getOgvJsVideoFrameRate() {
			if (videoInfo) {
				if (videoInfo.fps == 0) {
					return totalFrameCount / (totalFrameTime / 1000);
				} else {
					return videoInfo.fps;
				}
			} else {
				return 0;
			}
		}
	});

	// Audio metadata properties...
	Object.defineProperty(self, "ogvjsAudioChannels", {
		get: function getOgvJsAudioChannels() {
			if (audioInfo) {
				return audioInfo.channels;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "ogvjsAudioSampleRate", {
		get: function getOgvJsAudioChannels() {
			if (audioInfo) {
				return audioInfo.rate;
			} else {
				return 0;
			}
		}
	});

	// Display size...
	var width = 0, height = 0;
	/**
	 * @property width
	 * @todo reflect to the width attribute?
	 */
	Object.defineProperty(self, "width", {
		get: function getWidth() {
			return width;
		},
		set: function setWidth(val) {
			width = parseInt(val, 10);
			self.style.width = width + 'px';
			OGVPlayer.updatePositionOnResize();
		}
	});

	/**
	 * @property height
	 * @todo reflect to the height attribute?
	 */
	Object.defineProperty(self, "height", {
		get: function getHeight() {
			return height;
		},
		set: function setHeight(val) {
			height = parseInt(val, 10);
			self.style.height = height + 'px';
			OGVPlayer.updatePositionOnResize();
		}
	});

	/**
	 * @property autoplay {boolean} stub prop
	 * @todo reflect to the autoplay attribute?
	 * @todo implement actual autoplay behavior
	 */
	Object.defineProperty(self, "autoplay", {
		get: function getAutoplay() {
			return false;
		},
		set: function setAutoplay(val) {
			// ignore
		}
	});

	/**
	 * @property controls {boolean} stub prop
	 * @todo reflect to the controls attribute?
	 * @todo implement actual control behavior
	 */
	Object.defineProperty(self, "controls", {
		get: function getControls() {
			return false;
		},
		set: function setControls(val) {
			// ignore
		}
	});

	/**
	 * @property loop {boolean} stub prop
	 * @todo reflect to the controls attribute?
	 * @todo implement actual loop behavior
	 */
	Object.defineProperty(self, "loop", {
		get: function getLoop() {
			return false;
		},
		set: function setLoop(val) {
			// ignore
		}
	});

	/**
	 * @property crossOrigin {string|null} stub prop
	 * @todo reflect to the crossorigin attribute?
	 * @todo implement actual behavior
	 */
	Object.defineProperty(self, "crossOrigin", {
		get: function getCrossOrigin() {
			return null;
		},
		set: function setCrossOrigin(val) {
			// ignore
		}
	});

	/**
	 * Returns the URL to the currently-playing resource.
	 * @property currentSrc {string|null}
	 */
	Object.defineProperty(self, "currentSrc", {
		get: function getCurrentSrc() {
			// @todo return absolute URL per spec
			return currentSrc;
		}
	});

	Object.defineProperty(self, "defaultMuted", {
		get: function getDefaultMuted() {
			return false;
		}
	});

	Object.defineProperty(self, "defaultPlaybackRate", {
		get: function getDefaultPlaybackRate() {
			return 1;
		}
	});

	/**
	 * @property error {string|null}
	 * @todo implement
	 */
	Object.defineProperty(self, "error", {
		get: function getError() {
			if (state === State.ERROR) {
				if (mediaError) {
					return mediaError;
				} else {
					return new OGVMediaError("unknown error occurred in media procesing");
				}
			} else {
				return null;
			}
		}
	});
	/**
 	 * @property preload {string}
	 */
	Object.defineProperty(self, "preload", {
		get: function getPreload() {
			return self.getAttribute('preload') || '';
		},
		set: function setPreload(val) {
			self.setAttribute('preload', val);
		}
	});

	/**
	 * @property readyState {number}
	 * @todo return more accurate info about availability of data
	 */
	Object.defineProperty(self, "readyState", {
		get: function getReadyState() {
			if (stream && codec && codec.loadedMetadata) {
				// for now we don't really calc this stuff
				// just pretend we have lots of data coming in already
				return OGVPlayer.HAVE_ENOUGH_DATA;
			} else {
				return OGVPlayer.HAVE_NOTHING;
			}
		}
	});

	/**
	 * @property networkState {number}
	 * @todo implement
	 */
	Object.defineProperty(self, "networkState", {
		get: function getNetworkState() {
			if (stream) {
				if (stream.waiting) {
					return OGVPlayer.NETWORK_LOADING;
				} else {
					return OGVPlayer.NETWORK_IDLE;
				}
			} else {
				if (self.readyState == OGVPlayer.HAVE_NOTHING) {
					return OGVPlayer.NETWORK_EMPTY;
				} else {
					return OGVPlayer.NETWORK_NO_SOURCE;
				}
			}
		}
	});

	/**
	 * @property playbackRate {number}
	 * @todo implement
	 */
	Object.defineProperty(self, "playbackRate", {
		get: function getPlaybackRate() {
			return 1;
		},
		set: function setPlaybackRate(val) {
			// ignore
		}
	});

	/**
	 * @property played {OGVTimeRanges}
	 * @todo implement correctly more or less
	 */
	Object.defineProperty(self, "played", {
		get: function getPlayed() {
			return new OGVTimeRanges([[0, self.currentTime]]);
		}
	});

	var _volume = 1;

	/**
	 * @property volume {number}
	 * @todo implement
	 */
	Object.defineProperty(self, "volume", {
		get: function getVolume() {
			return _volume;
		},
		set: function setVolume(val) {
			_volume = +val;
			if (audioFeeder) {
				audioFeeder.volume = _volume;
			}
			fireEventAsync('volumechange');
		}
	});


	// Events!

	/**
	 * custom onframecallback, takes frame decode time in ms
	 */
	self.onframecallback = null;

	/**
	 * Network state events
	 * @todo implement
	 */
	self.onloadstate = null;
	self.onprogress = null;
	self.onsuspend = null;
	self.onabort = null;
	self.onemptied = null;
	self.onstalled = null;

	/**
	 * Called when all metadata is available.
	 * Note in theory we must know 'duration' at this point.
	 */
	self.onloadedmetadata = null;

	/**
	 * Called when enough data for first frame is ready.
	 * @todo implement
	 */
	self.onloadeddata = null;

	/**
	 * Called when enough data is ready to start some playback.
	 * @todo implement
	 */
	self.oncanplay = null;

	/**
	 * Called when enough data is ready to play through to the
	 * end if no surprises in network download rate.
	 * @todo implement
	 */
	self.oncanplaythrough = null;

	/**
	 * Called when playback continues after a stall
	 * @todo implement
	 */
	self.onplaying = null;

	/**
	 * Called when playback is delayed waiting on data
	 * @todo implement
	 */
	self.onwaiting = null;

	/**
	 * Called when seeking begins
	 * @todo implement
	 */
	self.onseeking = null;

	/**
	 * Called when seeking ends
	 * @todo implement
	 */
	self.onseeked = null;

	/**
	 * Called when playback ends
	 */
	self.onended = null;

	/**
	 * Called when duration becomes known
	 * @todo implement
	 */
	self.ondurationchange = null;

	/**
	 * Called periodically during playback
	 */
	self.ontimeupdate = null;

	/**
	 * Called when we start playback
	 */
	self.onplay = null;

	/**
	 * Called when we get paused
	 */
	self.onpause = null;

	/**
	 * Called when the playback rate changes
	 * @todo implement
	 */
	self.onratechange = null;

	/**
	 * Called when the size of the video stream changes
	 * @todo implement
	 */
	self.onresize = null;

	/**
	 * Called when the volume setting changes
	 * @todo implement
	 */
	self.onvolumechange = null;

	return self;
};

OGVPlayer.initSharedAudioContext = function() {
	AudioFeeder.initSharedAudioContext();
};

/**
 * Set up constants on the class and instances
 */
var constants = {
	/**
	 * Constants for networkState
	 */
	NETWORK_EMPTY: 0,
	NETWORK_IDLE: 1,
	NETWORK_LOADING: 2,
	NETWORK_NO_SOURCE: 3,

	/**
	 * Constants for readyState
	 */
	HAVE_NOTHING: 0,
	HAVE_METADATA: 1,
	HAVE_CURRENT_DATA: 2,
	HAVE_FUTURE_DATA: 3,
	HAVE_ENOUGH_DATA: 4
};
extend(OGVPlayer, constants);

OGVPlayer.instanceCount = 0;

function StyleManager() {
	var self = this;
	var el = document.createElement('style');
	el.type = 'text/css';
	el.textContent = 'ogvjs { ' +
		'display: inline-block; ' +
		'position: relative; ' +
		'-webkit-user-select: none; ' +
		'-webkit-tap-highlight-color: rgba(0,0,0,0); '
		'}';
	document.head.appendChild(el);

	var sheet = el.sheet;

	self.appendRule = function(selector, defs) {
		var bits = [];
		for (var prop in defs) {
			if (defs.hasOwnProperty(prop)) {
				bits.push(prop + ':' + defs[prop]);
			}
		}
		var rule = selector + '{' + bits.join(';') + '}';
		sheet.insertRule(rule, sheet.cssRules.length - 1);
	};
}
OGVPlayer.styleManager = new StyleManager();

// IE 10/11 and Edge 12 don't support object-fit.
// Also just for fun, IE 10 doesn't support 'auto' sizing on canvas. o_O
OGVPlayer.supportsObjectFit = (typeof document.createElement('div').style.objectFit === 'string');
if (OGVPlayer.supportsObjectFit && navigator.userAgent.match(/iPhone|iPad|iPod Touch/)) {
	// Safari for iOS 8/9 supports it but positions our <canvas> incorrectly when using WebGL >:(
	OGVPlayer.supportsObjectFit = false;
}
if (OGVPlayer.supportsObjectFit) {
	OGVPlayer.updatePositionOnResize = function() {
		// no-op
	};
} else {
	OGVPlayer.updatePositionOnResize = function() {
		function fixup(el, width, height) {
			var container = el.offsetParent || el.parentNode,
				containerAspect = container.offsetWidth / container.offsetHeight,
				intrinsicAspect = width / height;
			if (intrinsicAspect > containerAspect) {
				var vsize = container.offsetWidth / intrinsicAspect,
					vpad = (container.offsetHeight - vsize) / 2;
				el.style.width = '100%';
				el.style.height = vsize + 'px';
				el.style.marginLeft = 0;
				el.style.marginRight = 0;
				el.style.marginTop = vpad + 'px';
				el.style.marginBottom = vpad + 'px';
			} else {
				var hsize = container.offsetHeight * intrinsicAspect,
					hpad = (container.offsetWidth - hsize) / 2;
				el.style.width = hsize + 'px';
				el.style.height = '100%';
				el.style.marginLeft = hpad + 'px';
				el.style.marginRight = hpad + 'px';
				el.style.marginTop = 0;
				el.style.marginBottom = 0;
			}
		}
		function queryOver(selector, callback) {
			var nodeList = document.querySelectorAll(selector),
				nodeArray = Array.prototype.slice.call(nodeList);
			nodeArray.forEach(callback);
		}

		queryOver('ogvjs > canvas', function(canvas) {
			fixup(canvas, canvas.width, canvas.height);
		});
		queryOver('ogvjs > img', function(poster) {
			fixup(poster, poster.naturalWidth, poster.naturalHeight);
		});
	};
	var fullResizeVideo = function() {
		// fullscreens may ping us before the resize happens
		setTimeout(OGVPlayer.updatePositionOnResize, 0);
	};

	window.addEventListener('resize', OGVPlayer.updatePositionOnResize);
	window.addEventListener('orientationchange', OGVPlayer.updatePositionOnResize);

	document.addEventListener('fullscreenchange', fullResizeVideo);
	document.addEventListener('mozfullscreenchange', fullResizeVideo);
	document.addEventListener('webkitfullscreenchange', fullResizeVideo);
	document.addEventListener('MSFullscreenChange', fullResizeVideo);
}

module.exports = OGVPlayer;
