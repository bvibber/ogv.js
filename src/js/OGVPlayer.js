var WebGLFrameSink = require('./WebGLFrameSink.js');
var FrameSink = require('./FrameSink.js');

// -- OGVLoader.js
var OGVLoader = require("./OGVLoader.js");

// -- StreamFile.js
var StreamFile = require("./StreamFile.js");

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

/**
 * Player class -- instantiate one of these to get an 'ogvjs' HTML element
 * which has a similar interface to the HTML audio/video elements.
 *
 * @param options: optional dictionary of options:
 *                 'base': string; base URL for additional resources, such as Flash audio shim
 *                 'webGL': bool; pass true to use WebGL acceleration if available
 *                 'forceWebGL': bool; pass true to require WebGL even if not detected
 */
var OGVPlayer = function(options) {
	options = options || {};

	var instanceId = 'ogvjs' + (++OGVPlayer.instanceCount);

	var codecClass = null,
		codecType = null;

	var webGLdetected = WebGLFrameSink.isAvailable();
	var useWebGL = (options.webGL !== false) && webGLdetected;
	if(!!options.forceWebGL) {
		useWebGL = true;
		if(!webGLdetected) {
			console.log("No support for WebGL detected, but WebGL forced on!");
		}
	}

	// Experimental options
	var enableWebM = !!options.enableWebM;

	// Running the codec in a worker thread equals happy times!
	var enableWorker = !!window.Worker;
	if (typeof options.worker !== 'undefined') {
		enableWorker = !!options.worker;
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
	// Buffer in largeish chunks to survive long CPU spikes on slow CPUs (eg, 32-bit iOS)
	audioOptions.bufferSize = 8192;

	codecOptions.worker = enableWorker;
	if (typeof options.memoryLimit === 'number') {
		codecOptions.memoryLimit = options.memoryLimit;
	}

	var canvas = document.createElement('canvas');
	var frameSink;

	// Return a magical custom element!
	var self = document.createElement('ogvjs');
	self.className = instanceId;

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
		stoppedForLateFrame = false;
	function initAudioFeeder() {
		audioFeeder = new AudioFeeder( audioOptions );
		audioFeeder.init(audioInfo.channels, audioInfo.rate);
		//audioFeeder.bufferThreshold = 0.25; // buffer a quarter second of audio
		//audioFeeder.bufferThreshold = 0.5; // buffer a half second of audio
		audioFeeder.bufferThreshold = 1; // buffer a full second of audio
		audioFeeder.volume = self.volume;
		audioFeeder.muted = self.muted;

		// If we're in a background tab, timers may be throttled.
		// audioFeeder will call us when buffers need refilling,
		// without any throttling.
		audioFeeder.onbufferlow = function audioCallback() {
			log('onbufferlow');
			if (waitingOnInput || pendingAudio) {
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
			log('onstarved');
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
		log('continuing at ' + initialPlaybackPosition + ', ' + initialPlaybackOffset);
	}

	function stopPlayback() {
		if (audioFeeder) {
			audioFeeder.stop();
		}
		initialPlaybackOffset = getPlaybackTime();
		log('pausing at ' + initialPlaybackOffset);
	}

	/**
	 * Get audio playback time position in file's units
	 *
	 * @return {number} seconds since file start
	 */
	function getPlaybackTime(state) {
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

	var currentSrc = '',
		stream,
		streamEnded = false,
		byteLength = 0,
		duration = null,
		lastSeenTimestamp = null,
		nextProcessingTimer,
		nextFrameTimer = null,
		loading = false,
		started = false,
		paused = true,
		ended = false,
		startedPlaybackInDocument = false,
		waitingOnInput = false;

	var framesPlayed = 0;
	// Benchmark data, exposed via getPlaybackStats()
	var framesProcessed = 0, // frames
		targetPerFrameTime = 1000 / 60, // ms
		totalFrameTime = 0, // ms
		totalFrameCount = 0, // frames
		playTime = 0, // ms
		bufferTime = 0, // ms
		drawingTime = 0, // ms
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

		// Abort all queued actions
		actionQueue.splice(0, actionQueue.length);

		if (stream) {
			// @todo fire an abort event if still loading
			// @todo fire an emptied event if previously had data
			stream.abort();
			stream = null;
			streamEnded = false;
			waitingOnInput = false;
		}
		if (codec) {
			codec.close();
			codec = null;
			pendingFrame = 0;
			pendingAudio = 0;
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
		if (yCbCrBuffer) {
			yCbCrBuffer = null;
		}
		frameCompleteCallback = null;
		// @todo set playback position, may need to fire timeupdate if wasnt previously 0
		initialPlaybackPosition = 0;
		initialPlaybackOffset = 0;
		duration = null; // do not fire durationchange
		// timeline offset to 0?
	}

	var lastFrameTime = getTimestamp(),
		frameEndTimestamp = 0.0,
		audioEndTimestamp = 0.0,
		yCbCrBuffer = null,
		frameCompleteCallback = null;
	var lastFrameDecodeTime = 0.0,
		lastFrameVideoCpuTime = 0,
		lastFrameAudioCpuTime = 0,
		lastFrameDemuxerCpuTime = 0,
		lastFrameDrawingTime = 0,
		lastFrameBufferTime = 0;
		lastVideoCpuTime = 0,
		lastAudioCpuTime = 0,
		lastDemuxerCpuTime = 0,
		lastBufferTime = 0,
		lastDrawingTime = 0;
	var lastFrameTimestamp = 0.0,
		currentVideoCpuTime = 0.0;

	var lastTimeUpdate = 0, // ms
		timeUpdateInterval = 250; // ms

	function doFrameComplete() {
		if (startedPlaybackInDocument && !document.body.contains(self)) {
			// We've been de-parented since we last ran
			// Stop playback at next opportunity!
			setTimeout(function() {
				self.stop();
			}, 0);
		}

		var newFrameTimestamp = getTimestamp(),
			wallClockTime = newFrameTimestamp - lastFrameTimestamp,
			jitter = wallClockTime - targetPerFrameTime;
		totalJitter += Math.abs(jitter);
		playTime += wallClockTime;

		var timing = {
			cpuTime: lastFrameDecodeTime,
			drawingTime: drawingTime - lastFrameDrawingTime,
			bufferTime: bufferTime - lastFrameBufferTime,
			
			demuxerTime: 0,
			videoTime: 0,
			audioTime: 0,
			clockTime: wallClockTime
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

		function n(x) {
			return Math.round(x * 10) / 10;
		}
		log('drew frame clock time ' + n(wallClockTime) + ' (jitter ' + n(jitter) + ') ' +
			'cpu: ' + n(timing.cpuTime) + ' (mux: ' + n(timing.demuxerTime) + ' buf: ' + n(timing.bufferTime) + ' draw: ' + n(timing.drawingTime) + ') ' +
			'vid: ' + n(timing.videoTime) + ' aud: ' + n(timing.audioTime));
		fireEventAsync('framecallback', timing);

		if (!lastTimeUpdate || (newFrameTimestamp - lastTimeUpdate) >= timeUpdateInterval) {
			lastTimeUpdate = newFrameTimestamp;
			fireEventAsync('timeupdate');
		}

		if (frameCompleteCallback) {
			//log('found a frameCompleteCallback!')
			var cb = frameCompleteCallback;
			frameCompleteCallback = null;
			cb();
		}
	}


	// -- seek functions
	var seekTargetTime = 0.0,
		seekTargetKeypoint = 0.0,
		bisectTargetTime = 0.0,
		lastSeekPosition,
		lastFrameSkipped,
		seekBisector;

	function startBisection(targetTime) {
		bisectTargetTime = targetTime;
		seekBisector = new Bisector({
			start: 0,
			end: stream.bytesTotal - 1,
			process: function(start, end, position) {
				if (position == lastSeekPosition) {
					return false;
				} else {
					lastSeekPosition = position;
					lastFrameSkipped = false;
					codec.flush(function() {
						stream.seek(position);
						readBytesAndWait();
					});
					return true;
				}
			}
		});
		seekBisector.start();
	}

	function seek(toTime) {
		log('requested seek to ' + toTime);
		if (stream.bytesTotal === 0) {
			throw new Error('Cannot bisect a non-seekable stream');
		}
		function prepForSeek() {
			if (waitingOnInput) {
				stream.abort();
				waitingOnInput = false;
			}
			// clear any queued input/seek-start
			actionQueue.splice(0, actionQueue.length);
			stopPlayback();
			if (audioFeeder) {
				audioFeeder.flush();
			}
			state = State.SEEKING;
			seekTargetTime = toTime;
		}

		// Abort any previous seek or play suitably
		prepForSeek();

		actionQueue.push(function() {
			// Just in case another async task stopped us...
			prepForSeek();
			streamEnded = false;
			ended = false;
			state = State.SEEKING;
			seekTargetTime = toTime;
			seekTargetKeypoint = -1;
			lastFrameSkipped = false;
			lastSeekPosition = -1;

			frameCompleteCallback = null;
			pendingFrame = 0;
			pendingAudio = 0;
			codec.flush(function() {
				codec.seekToKeypoint(toTime, function(seeking) {
					if (seeking) {
						seekState = SeekState.LINEAR_TO_TARGET;
						fireEventAsync('seeking');
						if (isProcessing()) {
							// wait for i/o
						} else {
							pingProcessing();
						}
						return;
					}
					// Use the old interface still implemented on ogg demuxer
					codec.getKeypointOffset(toTime, function(offset) {
						if (offset > 0) {
							// This file has an index!
							//
							// Start at the keypoint, then decode forward to the desired time.
							//
							seekState = SeekState.LINEAR_TO_TARGET;
							stream.seek(offset);
							readBytesAndWait();
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

						fireEvent('seeking');
					});
				});
			});
		});
		if (isProcessing()) {
			// already waiting on input
		} else {
			pingProcessing(0);
		}
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

		if (paused) {
			//stopPlayback(); // :P

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
						yCbCrBuffer = null;
					}
					finishedSeeking();
				} );
				return;
			}
		}
		finishedSeeking();
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
			if (!codec.frameReady) {
				// Haven't found a frame yet, process more data
				pingProcessing();
				return;
			} else if (codec.frameTimestamp + frameDuration < seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time.
				// Decode it in case we're at our keyframe or a following intraframe...
				waitingOnInput = true;
				codec.decodeFrame(function() {
					waitingOnInput = false;
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
			if (!codec.audioReady) {
				// Haven't found an audio packet yet, process more data
				pingProcessing();
				return;
			} else if (codec.audioTimestamp + frameDuration < seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time.
				// Decode it so when we reach the target we've got consistent data.
				waitingOnInput = true;
				codec.decodeAudio(function() {
					waitingOnInput = false;
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
			if (!codec.frameReady) {
				// Haven't found a frame yet, process more data
				pingProcessing();
				return;
			}
			timestamp = codec.frameTimestamp;
			frameDuration = targetPerFrameTime / 1000;
		} else if (codec.hasAudio) {
			if (!codec.audioReady) {
				// Haven't found an audio packet yet, process more data
				pingProcessing();
				return;
			}
			timestamp = codec.audioTimestamp;
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		} else {
			throw new Error('Invalid seek state; no audio or video track available');
		}

		if (timestamp < 0) {
			// Haven't found a time yet.
			// Decode in case we're at our keyframe or a following intraframe...
			if (codec.frameReady) {
				codec.decodeFrame(function() {
					pingProcessing();
				});
			} else if (codec.audioReady) {
				codec.decodeAudio(function() {
					pingProcessing();
				});
			} else {
				pingProcessing();
			}
		} else if (timestamp - frameDuration / 2 > bisectTargetTime) {
			if (seekBisector.left()) {
				// wait for new data to come in
			} else {
				log('close enough (left)');
				seekTargetTime = codec.frameTimestamp;
				continueSeekedPlayback();
			}
		} else if (timestamp + frameDuration / 2 < bisectTargetTime) {
			if (seekBisector.right()) {
				// wait for new data to come in
			} else {
				log('close enough (right)');
				seekTargetTime = codec.frameTimestamp;
				continueSeekedPlayback();
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

		if (useWebGL) {
			frameSink = new WebGLFrameSink(canvas, videoInfo);
		} else {
			frameSink = new FrameSink(canvas, videoInfo);
		}
	}

	var depth = 0,
		needProcessing = false,
		pendingFrame = 0,
		pendingAudio = 0;

	function doProcessing() {
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

			codec.process(function processInitial(more) {
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
								stream.seek(Math.max(0, stream.bytesTotal - 65536 * 2));
								readBytesAndWait();
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
				} else if (!more) {
					// Read more data!
					log('reading more cause we are out of data');
					readBytesAndWait();
				} else {
					// Keep processing headers
					pingProcessing();
				}
			});

		} else if (state == State.SEEKING_END) {

			// Look for the last item.
			codec.process(function processSeekingEnd(more) {
				if (codec.hasVideo && codec.frameReady) {
					lastSeenTimestamp = Math.max(lastSeenTimestamp, codec.frameTimestamp);
					codec.discardFrame(function() {
						pingProcessing();
					});
				} else if (codec.hasAudio && codec.audioReady) {
					lastSeenTimestamp = Math.max(lastSeenTimestamp, codec.audioTimestamp);
					codec.decodeAudio(function() {
						pingProcessing();
					});
				} else if (!more) {
					// Read more data!
					if (stream.bytesRead < stream.bytesTotal) {
						readBytesAndWait();
					} else {
						// We are at the end!
						log('seek-duration: we are at the end');
						if (lastSeenTimestamp > 0) {
							duration = lastSeenTimestamp;
						}

						// Ok, seek back to the beginning and resync the streams.
						state = State.LOADED;
						codec.flush(function() {
							stream.seek(0);
							streamEnded = false;
							readBytesAndWait();
						});
					}
				} else {
					// Keep processing headers
					pingProcessing();
				}
			});

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

			if (paused) {

				// Paused? stop here.
				log('paused while in ready');

			} else {

				function finishStartPlaying() {
					log('finishStartPlaying');

					state = State.PLAYING;
					lastFrameTimestamp = getTimestamp();

					startPlayback();
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

			//console.log('seeking', seekTargetTime, codec.frameTimestamp, codec.audioTimestamp, stream.bytesRead, stream.bytesBuffered - stream.bytesRead);
			if ((codec.hasVideo && codec.frameTimestamp < 0)
			 || (codec.hasAudio && codec.audioTimestamp < 0)
			) {
				codec.process(function processSeeking(more) {
					if (more) {
						pingProcessing();
					} else {
						readBytesAndWait();
					}
				});
			} else if (seekState == SeekState.NOT_SEEKING) {
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

					if ((!codec.hasAudio || codec.audioReady || pendingAudio) &&
					 	(!codec.hasVideo || codec.frameReady || pendingFrame || yCbCrBuffer)
					) {

						var audioState = null,
							playbackPosition = 0,
							readyForAudioDecode,
							readyForFrameDraw,
							frameDelay = 0,
							readyForFrameDecode;

						if (codec.hasAudio && audioFeeder) {
							// Drive on the audio clock!
							audioState = audioFeeder.getPlaybackState();
							playbackPosition = getPlaybackTime(audioState);

							if (audioState.dropped != droppedAudio) {
								log('dropped ' + (audioState.dropped - droppedAudio));
							}
							if (audioState.delayed != delayedAudio) {
								log('delayed ' + (audioState.delayed - delayedAudio));
							}
							droppedAudio = audioState.dropped;
							delayedAudio = audioState.delayed;
							//readyForAudioDecode = !pendingAudio && codec.audioReady && audioFeeder.durationBuffered <= audioFeeder.bufferThreshold;
							
							readyForAudioDecode = audioFeeder.durationBuffered <
								audioFeeder.bufferThreshold;

							// Check in when all audio runs out
							if (pendingAudio > 8) {
								// We'll check in when done decoding
								readyForAudioDecode = false;
							} else if (!codec.audioReady) {
								// NEED MOAR BUFFERS
								readyForAudioDecode = false;
							} else {
								// Check in when the audio buffer runs low again...
								// wait for audioFeeder to ping us
							}
							if (!pendingAudio) {
								log('audio checkin: ' + [readyForAudioDecode, audioFeeder.bufferThreshold, audioFeeder.durationBuffered, playbackPosition, frameEndTimestamp, audioEndTimestamp, codec.audioReady].join(', '))
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
							// ok to draw 2ms early
							var fudgeDelta = 2;

							frameDelay = (frameEndTimestamp - playbackPosition) * 1000;
							//frameDelay = Math.max(0, frameDelay);
							frameDelay = Math.min(frameDelay, targetPerFrameTime);

							readyForFrameDraw = !!yCbCrBuffer;
							readyForFrameDecode = !frameCompleteCallback && !pendingFrame && codec.frameReady;

							var audioSyncThreshold = Math.max(targetPerFrameTime, 1000 / 30);
							if (readyForFrameDraw && -frameDelay >= audioSyncThreshold) {
								// late frame!
								if (!stoppedForLateFrame) {
									log('late frame: ' + (-frameDelay) + ' expected ' + audioSyncThreshold);
									lateFrames++;
									stoppedForLateFrame = true;
									if (audioFeeder) {
										// @fixme handle non-audio path too
										audioFeeder.stop();
									}
								}
							} else if (readyForFrameDraw && stoppedForLateFrame) {
								// catching up, ok if we were early
								log('late frame recovery reached');
								stoppedForLateFrame = false;
								if (audioFeeder) {
									// @fixme handle non-audio path too
									audioFeeder.start();
								}
							} else if (readyForFrameDraw && frameDelay <= fudgeDelta) {
								// on time! draw
							} else {
								// not yet
								readyForFrameDraw = false;
							}
						}

						//log([playbackPosition, frameEndTimestamp, audioEndTimestamp, readyForFrameDraw, readyForFrameDecode, readyForAudioDecode].join(', '));

						if (readyForFrameDecode) {

							log('ready to decode frame');

							pendingFrame++;
							if (videoInfo.fps == 0 && (codec.frameTimestamp - frameEndTimestamp) > 0) {
								// WebM doesn't encode a frame rate
								targetPerFrameTime = (codec.frameTimestamp - frameEndTimestamp) * 1000;
							}
							totalFrameTime += targetPerFrameTime;
							totalFrameCount++;
							
							var nextFrameEndTimestamp = codec.frameTimestamp;
							function onDecodeFrameComplete(ok) {
								pendingFrame--;
								frameEndTimestamp = nextFrameEndTimestamp;
								currentVideoCpuTime = codec.videoCpuTime;
								if (ok) {
									// Save the buffer until it's time to draw
									yCbCrBuffer = codec.frameBuffer;
								} else {
									// Bad packet or something.
									log('Bad video packet or something');
								}
							}
							time(function() {
								codec.decodeFrame(function processingDecodeFrame(ok) {
									log('decoded frame');
									if (frameCompleteCallback) {
										throw new Error('Reentrancy error: decoded frames without drawing them');
									} else if (yCbCrBuffer) {
										//log('already have a decoded frame, saving this for later');
										frameCompleteCallback = function() {
											onDecodeFrameComplete(ok);
										};
										pingProcessing();
									} else {
										onDecodeFrameComplete(ok);
										pingProcessing();
									}
								});
							});
							if (pendingFrame) {
								// We can process something else while that's running
								pingProcessing();
							}

						} else if (readyForAudioDecode) {

							log('ready for audio');

							pendingAudio++;
							var nextAudioEndTimestamp = codec.audioTimestamp;
							time(function() {
								codec.decodeAudio(function processingDecodeAudio(ok) {
									pendingAudio--;
									log('decoded audio');
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
												doFrameComplete();
											}
										}
									}
									pingProcessing();
								});
							});
							if (pendingAudio) {
								// We can process something else while that's running
								pingProcessing();
							}

						} else if (readyForFrameDraw) {

							log('ready to draw frame');

							if (nextFrameTimer) {
								clearTimeout(nextFrameTimer);
								nextFrameTimer = null;
							}

							// Ready to draw the decoded frame...
							if (thumbnail) {
								self.removeChild(thumbnail);
								thumbnail = null;
							}

							var dupe = yCbCrBuffer.duplicate;
							if (!dupe) {
								drawingTime += time(function() {
									frameSink.drawFrame(yCbCrBuffer);
								});
							}
							yCbCrBuffer = null;

							framesProcessed++;
							framesPlayed++;

							doFrameComplete();

							pingProcessing();

						} else if (yCbCrBuffer && !nextFrameTimer) {

							if (frameDelay < 4) {
								// Either we're very close or the frame rate is
								// insanely high (infamous '1000fps bug')
								// Timer will take 4ms anyway, so just check in now.
								pingProcessing();
							} else {
								// @todo consider using requestAnimationFrame
								log('setting a timer for drawing ' + frameDelay);
								nextFrameTimer = setTimeout(function() {
									nextFrameTimer = null;
									pingProcessing();
								}, frameDelay);
							}

						} else {

							log('waiting on async/timers');

						}

					} else {
						doProcessPlayDemux();
					}
				}
			}
			
			function doProcessPlayDemux() {
				codec.process(function doProcessPlayDemuxHandler(more) {
					if (more) {
						// Have to process some more pages to find data.
						log('demuxer processing to find more packets');
						pingProcessing();
					} else {
						log('demuxer ran out of data');
						if (!streamEnded) {
							// Ran out of buffered input
							log('demuxer loading more data');
							readBytesAndWait();
						} else if (ended) {
							log('demuxer unexpectedly processing after ended');
						} else {
							// Ran out of stream!
							log('demuxer reached end of stream');
							var finalDelay = 0;
							if (codec.hasAudio) {
								finalDelay = audioFeeder.durationBuffered * 1000;
							}
							if (finalDelay > 0) {
								log('ending pending ' + finalDelay + ' ms');
								pingProcessing(Math.max(0, finalDelay));
							} else {
								log("ENDING NOW");
								stopPlayback();
								initialPlaybackOffset = Math.max(audioEndTimestamp, frameEndTimestamp);
								ended = true;
								// @todo implement loop behavior
								paused = true;
								fireEventAsync('pause');
								fireEventAsync('ended');
							}
						}
					}
				});
			}

			if (codec.audioReady || codec.frameReady) {
				// On low-end devices we want to take it easy.
				// Demux audio packets one at a time!
				doProcessPlay();
			} else {
				// No packets? Go demux!
				doProcessPlayDemux();
			}

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
		return waitingOnInput || (codec && codec.processing);
	}

	function readBytesAndWait() {
		if (waitingOnInput) {
			throw new Error('Re-entrancy fail: asked for input when already waiting');
		}
		waitingOnInput = true;
		stream.readBytes();
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
		if (waitingOnInput) {
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
			nextProcessingTimer = setTimeout(doProcessing, delay);
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
		started = true;
		ended = false;

		codec = new codecClass(codecOptions);
		lastVideoCpuTime = 0;
		lastAudioCpuTime = 0;
		lastDemuxerCpuTime = 0;
		lastBufferTime = 0;
		lastDrawingTime = 0;
		lastFrameVideoCpuTime = 0;
		lastFrameAudioCpuTime = 0;
		lastFrameDemuxerCpuTime = 0;
		lastFrameBufferTime = 0;
		lastFrameDrawingTime = 0;
		currentVideoCpuTime = 0;
		frameCompleteCallback = null;
		codec.onseek = function(offset) {
			if (stream) {
				console.log('SEEKING TO', offset);
				stream.seek(offset);
				readBytesAndWait();
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
		stopVideo();

		// @todo networkState = self.NETWORK_NO_SOURCE;
		// @todo show poster
		// @todo set 'delay load event flag'

		currentSrc = '';
		loading = true;

		actionQueue.push(function() {

			// @todo networkState == NETWORK_LOADING
			stream = new StreamFile({
				url: self.src,
				bufferSize: 32768, //65536 * 4,
				onstart: function() {
					waitingOnInput = false;
					loading = false;

					// @todo handle failure / unrecognized type

					currentSrc = self.src;

					// Fire off the read/decode/draw loop...
					byteLength = stream.bytesTotal;

					// If we get X-Content-Duration, that's as good as an explicit hint
					var durationHeader = stream.getResponseHeader('X-Content-Duration');
					if (typeof durationHeader === 'string') {
						duration = parseFloat(durationHeader);
					}
					loadCodec(startProcessingVideo);
				},
				onread: function(data) {
					log('got input');
					waitingOnInput = false;

					// Save chunk to pass into the codec's buffer
					actionQueue.push(function doReceiveInput() {
						codec.receiveInput(data, function() {
							pingProcessing();
						});
					});

					if (isProcessing()) {
						// We're waiting on the codec already...
					} else {
						pingProcessing();
					}
				},
				ondone: function() {
					waitingOnInput = false;

					// @todo record doneness in networkState
					log('stream is at end!');
					streamEnded = true;

					if (isProcessing()) {
						// We're waiting on the codec already...
					} else {
						// Let the read/decode/draw loop know we're out!
						pingProcessing();
					}
				},
				onerror: function(err) {
					waitingOnInput = false;
					// @todo handle failure to initialize
					console.log("reading error: " + err);
					stopPlayback();
					state = State.ERROR;
				}
			});
			waitingOnInput = true;
		});
		pingProcessing(0);
	};

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

			if (started && codec && codec.loadedMetadata) {

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
		self.currentTime = +seekToTime;
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
			self.load();
		}
	});

	/**
	 * HTMLMediaElement buffered property
	 */
	Object.defineProperty(self, "buffered", {
		get: function getBuffered() {
			var estimatedBufferTime;
			if (stream && byteLength && duration) {
				estimatedBufferTime = (stream.bytesBuffered / byteLength) * duration;
			} else {
				estimatedBufferTime = 0;
			}
			return new OGVTimeRanges([[0, estimatedBufferTime]]);
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
					return 0;
				}
			}
		},
		set: function setCurrentTime(val) {
			if (stream && byteLength && duration) {
				seek(val);
			}
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
				return "error occurred in media procesing";
			} else {
				return null;
			}
		}
	});
	/**
 	 * @property preload {string}
	 * @todo implement
	 */
	Object.defineProperty(self, "preload", {
		get: function getPreload() {
			return 'auto';
		},
		set: function setPreload(val) {
			// ignore
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
				if (waitingOnInput) {
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

	// Copy the various public state constants in
	setupConstants(self);

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
function setupConstants(obj) {
	for (var constName in constants) {
		if (constants.hasOwnProperty(constName)) {
			(function(name, val) {
				Object.defineProperty(obj, constName, {
					get: function() {
						return val;
					}
				});
			})(constName, constants[constName]);
		}
	}
}
setupConstants(OGVPlayer);

OGVPlayer.instanceCount = 0;

function StyleManager() {
	var self = this;
	var el = document.createElement('style');
	el.type = 'text/css';
	el.textContent = 'ogvjs { display: inline-block; position: relative; }';
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
// Chrome 43 supports it but it doesn't work on <canvas>!
// Safari for iOS 8/9 supports it but positions our <canvas> incorrectly >:(
// Also just for fun, IE 10 doesn't support 'auto' sizing on canvas. o_O
//OGVPlayer.supportsObjectFit = (typeof document.createElement('div').style.objectFit === 'string');
OGVPlayer.supportsObjectFit = false;
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
