var WebGLFrameSink = require('./WebGLFrameSink.js');
var FrameSink = require('./FrameSink.js');

// -- OGVLoader.js
var OGVLoader = require("./OGVLoader.js");

// -- StreamFile.js
var StreamFile = require("./StreamFile.js");

// -- AudioFeeder.js
var AudioFeeder = require("audio-feeder");

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
		READY: 'READY',
		PLAYING: 'PLAYING',
		SEEKING: 'SEEKING',
		ENDED: 'ENDED'
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
	codecOptions.worker = enableWorker;

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
			/*
			var now = getTimestamp(),
				delta = now - then;

			console.log('+' + delta + 'ms proc: ' + msg);
			then = now;
			*/
			console.log('OGVPlayer: ' + msg);
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

	var codec,
		actionQueue = [],
		audioFeeder;
	var muted = false,
		initialPlaybackPosition = 0.0,
		initialPlaybackOffset = 0.0;
	function initAudioFeeder() {
		audioFeeder = new AudioFeeder( audioOptions );
		audioFeeder.onstarved = function() {
			// If we're in a background tab, timers may be throttled.
			// When audio buffers run out, go decode some more stuff.
			if (nextProcessingTimer) {
				clearTimeout(nextProcessingTimer);
				nextProcessingTimer = null;
				pingProcessing();
			}
		};
		audioFeeder.init(audioInfo.channels, audioInfo.rate);
		audioFeeder.volume = self.volume;
		audioFeeder.muted = self.muted;
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
		demuxingTime = 0, // ms
		videoDecodingTime = 0, // ms
		audioDecodingTime = 0, // ms
		bufferTime = 0, // ms
		drawingTime = 0, // ms
		totalJitter = 0; // sum of ms we're off from expected frame delivery time
	// Benchmark data that doesn't clear
	var droppedAudio = 0, // number of times we were starved for audio
		delayedAudio = 0; // seconds audio processing was delayed by blocked CPU
	var poster = '', thumbnail;

	// called when stopping old video on load()
	function stopVideo() {
		log("STOPPING");
		// kill the previous video if any
		state = State.INITIAL;
		seekState = SeekState.NOT_SEEKING;
		started = false;
		paused = true;
		ended = false;
		frameEndTimestamp = 0.0;
		audioEndTimestamp = 0.0;
		lastFrameDecodeTime = 0.0;

		if (stream) {
			// @todo fire an abort event if still loading
			// @todo fire an emptied event if previously had data
			stream.abort();
			stream = null;
			streamEnded = false;
		}
		if (codec) {
			codec.destroy();
			codec = null;
		}
		if (audioFeeder) {
			audioFeeder.close();
			audioFeeder = undefined;
		}
		if (nextProcessingTimer) {
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
		}
		// @todo set playback position, may need to fire timeupdate if wasnt previously 0
		duration = NaN; // do not fire durationchange
		// timeline offset to 0?
	}

	var lastFrameTime = getTimestamp(),
		frameEndTimestamp = 0.0,
		audioEndTimestamp = 0.0,
		yCbCrBuffer = null;
	var lastFrameDecodeTime = 0.0;
	var lastFrameTimestamp = 0.0;

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
			jitter = Math.abs(wallClockTime - targetPerFrameTime);
		totalJitter += jitter;
		playTime += wallClockTime;

		fireEvent('framecallback', {
			cpuTime: lastFrameDecodeTime,
			clockTime: wallClockTime
		});

		lastFrameDecodeTime = 0;
		lastFrameTimestamp = newFrameTimestamp;

		if (!lastTimeUpdate || (newFrameTimestamp - lastTimeUpdate) >= timeUpdateInterval) {
			lastTimeUpdate = newFrameTimestamp;
			fireEvent('timeupdate');
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
		if (stream.bytesTotal === 0) {
			throw new Error('Cannot bisect a non-seekable stream');
		}
		streamEnded = false;
		state = State.SEEKING;
		seekTargetTime = toTime;
		seekTargetKeypoint = -1;
		lastFrameSkipped = false;
		lastSeekPosition = -1;

		actionQueue.push(function() {
			stopPlayback();

			codec.flush(function() {
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
	}

	function continueSeekedPlayback() {
		seekState = SeekState.NOT_SEEKING;
		state = State.PLAYING;
		frameEndTimestamp = codec.frameTimestamp;
		audioEndTimestamp = codec.audioTimestamp;
		if (codec.hasAudio) {
			seekTargetTime = codec.audioTimestamp;
		} else {
			seekTargetTime = codec.frameTimestamp;
		}
		startPlayback(seekTargetTime);
		if (paused) {
			stopPlayback(); // :P
		} else {
			if (isProcessing()) {
				// wait for whatever's going on to complete
			} else {
				pingProcessing(0);
			}
		}
		fireEvent('seeked');
	}

	/**
	 * @return {boolean} true to continue processing, false to wait for input data
	 */
	function doProcessLinearSeeking() {
		var frameDuration;
		if (codec.hasVideo) {
			frameDuration = targetPerFrameTime;
		} else {
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		}

		if (codec.hasVideo) {
			if (!codec.frameReady) {
				// Haven't found a frame yet, process more data
				pingProcessing();
				return;
			} else if (codec.frameTimestamp < 0 || codec.frameTimestamp + frameDuration < seekTargetTime) {
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
			if (!codec.audioReady) {
				// Haven't found an audio packet yet, process more data
				pingProcessing();
				return;
			}
			if (codec.audioTimestamp < 0 || codec.audioTimestamp + frameDuration < seekTargetTime) {
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
			if (!codec.frameReady) {
				// Haven't found a frame yet, process more data
				pingProcessing();
				return;
			}
			timestamp = codec.frameTimestamp;
			frameDuration = targetPerFrameTime;
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
		} else if (timestamp - frameDuration > bisectTargetTime) {
			if (seekBisector.left()) {
				// wait for new data to come in
			} else {
				seekTargetTime = codec.frameTimestamp;
				continueSeekedPlayback();
			}
		} else if (timestamp + frameDuration < bisectTargetTime) {
			if (seekBisector.right()) {
				// wait for new data to come in
			} else {
				seekTargetTime = codec.frameTimestamp;
				continueSeekedPlayback();
			}
		} else {
			// Reached the bisection target!
			if (seekState == SeekState.BISECT_TO_TARGET && (codec.hasVideo && codec.keyframeTimestamp < codec.frameTimestamp)) {
				// We have to go back and find a keyframe. Sigh.
				seekState = SeekState.BISECT_TO_KEYPOINT;
				startBisection(codec.keyframeTimestamp);
			} else {
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
		useImmediate = options.useImmediate && !!window.setImmediate,
		useTailCalls = !useImmediate,
		pendingFrame = 0,
		pendingAudio = 0;

	function tailCall(func) {
		if (useImmediate) {
			setImmediate(func);
		} else if (!useTailCalls) {
			setTimeout(func, 0);
		} else {
			func();
		}
	}

	function doProcessing() {
		nextProcessingTimer = null;

		if (isProcessing()) {
			// Called async while waiting for something else to complete...
			// let it finish, then we'll get called again to continue.
			return;
		}

		if (depth > 0 && !useTailCalls) {
			throw new Error('REENTRANCY FAIL: doProcessing recursing unexpectedly');
		}
		depth++;

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

			state = State.READY;
			if (paused) {
				// Paused? stop here.
				log('pausing stopping at loaded');
			} else {
				// Not paused? Continue on to play processing.
				log('not paused so continuing');
				pingProcessing(0);
			}
			fireEvent('loadedmetadata');
			fireEvent('durationchange');
			if (codec.hasVideo) {
				fireEvent('resize');
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

					startPlayback(0.0);
					pingProcessing(0);
					fireEvent('play');
				}

				if (codec.hasAudio) {
					initAudioFeeder();
					audioFeeder.waitUntilReady(finishStartPlaying);
				} else {
					finishStartPlaying();
				}
			}

		} else if (state == State.SEEKING) {

			codec.process(function processSeeking(more) {
				if (!more) {
					readBytesAndWait();
				} else if (seekState == SeekState.NOT_SEEKING) {
					throw new Error('seeking in invalid state (not seeking?)');
				} else if (seekState == SeekState.BISECT_TO_TARGET) {
					doProcessBisectionSeek();
				} else if (seekState == SeekState.BISECT_TO_KEYPOINT) {
					doProcessBisectionSeek();
				} else if (seekState == SeekState.LINEAR_TO_TARGET) {
					doProcessLinearSeeking();
				}
			});

		} else if (state == State.PLAYING) {

			var demuxStartTime = getTimestamp();
			codec.process(function doProcessPlay(more) {
				var delta = getTimestamp() - demuxStartTime;
				demuxingTime += delta;
				lastFrameDecodeTime += delta;

				//console.log(more, codec.audioReady, codec.frameReady, codec.audioTimestamp, codec.frameTimestamp);

				if (!more) {
					if (!streamEnded) {
						// Ran out of buffered input
						readBytesAndWait();
					} else {
						// Ran out of stream!
						log('Ran out of stream!');
						var finalDelay = 0;
						if (codec.hasAudio) {
							audioState = audioFeeder.getPlaybackState();
							audioBufferedDuration = (audioState.samplesQueued / audioFeeder.targetRate);
							finalDelay = audioBufferedDuration * 1000;
						}
						if (pendingAudio || pendingFrame || finalDelay > 0) {
							log('ending pending ' + finalDelay + ' ms');
							pingProcessing(Math.max(0, finalDelay));
						} else {
							log("ENDING NOW");
							stopPlayback();
							ended = true;
							fireEvent('ended');
							// @todo implement loop behavior
						}
					}
				} else if (paused) {

					// ok we're done for now!

				} else {

					if (!((codec.audioReady || !codec.hasAudio) && (codec.frameReady || !codec.frameReady))) {

						log('need more data');

						// Have to process some more pages to find data.
						pingProcessing();

					} else {

						var audioBufferedDuration = 0,
							audioDecodingDuration = 0,
							audioState = null,
							playbackPosition = 0,
							nextDelays = [],
							readyForAudioDecode,
							readyForFrameDraw,
							readyForFrameDecode;

						if (codec.hasAudio && audioFeeder) {
							// Drive on the audio clock!
							audioState = audioFeeder.getPlaybackState();
							playbackPosition = getPlaybackTime(audioState);

							audioBufferedDuration = (audioState.samplesQueued / audioFeeder.targetRate);
							//audioBufferedDuration = audioEndTimestamp - playbackPosition; // @fixme?

							//console.log('audio buffered', audioBufferedDuration, audioDecodingDuration);

							droppedAudio = audioState.dropped;
							delayedAudio = audioState.delayed;
							//readyForAudioDecode = audioState.samplesQueued <= (audioFeeder.bufferSize * 2);
							var bufferDuration = (audioFeeder.bufferSize / audioFeeder.targetRate) * 2;
							readyForAudioDecode = codec.audioReady && (audioBufferedDuration <= bufferDuration);

							// Check in when all audio runs out
							if (pendingAudio) {
								// We'll check in when done decoding
							} else if (!codec.audioReady) {
								// NEED MOAR BUFFERS
								nextDelays.push(-1);
							} else if (codec.hasVideo && (playbackPosition - frameEndTimestamp) > bufferDuration) {
								// don't get too far ahead of the video if it's slow!
								readyForAudioDecode = false;
								nextDelays.push((playbackPosition - frameEndTimestamp) * 1000);
							} else {
								// Check in when the audio buffer runs low again...
								nextDelays.push((audioBufferedDuration - bufferDuration) * 1000);

								// @todo figure out why the above doesn't do the job reliably
								// with Flash audio shim on IE!
								nextDelays.push(bufferDuration * 1000 / 4);
							}
						} else {
							// No audio; drive on the general clock.
							// @fixme account for dropped frame times...
							playbackPosition = getPlaybackTime();
						}

						if (codec.hasVideo) {
							var fudgeDelta = 0.1,
								frameDelay = (frameEndTimestamp - playbackPosition) * 1000;

							frameDelay = Math.max(0, frameDelay);
							frameDelay = Math.min(frameDelay, targetPerFrameTime);

							readyForFrameDraw = !!yCbCrBuffer && !pendingFrame && (frameDelay <= fudgeDelta);
							readyForFrameDecode = !yCbCrBuffer && !pendingFrame && codec.frameReady;

							if (yCbCrBuffer) {
								// Check in when the decoded frame is due
								nextDelays.push(frameDelay);
							} else if (pendingFrame) {
								// We'll check in when done decoding
							} else if (!codec.frameReady) {
								// need more data!
								nextDelays.push(-1);
							} else {
								// Check in when the decoded frame is due
								nextDelays.push(frameDelay);
							}
						}

						log([playbackPosition, frameEndTimestamp, audioEndTimestamp, readyForFrameDraw, readyForFrameDecode, readyForAudioDecode].join(', '));

						if (readyForFrameDraw) {

							log('ready to draw frame');

							// Ready to draw the decoded frame...
							if (thumbnail) {
								self.removeChild(thumbnail);
								thumbnail = null;
							}

							drawingTime += time(function() {
								frameSink.drawFrame(yCbCrBuffer);
							});
							yCbCrBuffer = null;

							framesProcessed++;
							framesPlayed++;

							doFrameComplete();

							pingProcessing(0);

						} else if (readyForFrameDecode) {

							log('ready to decode frame');

							var videoStartTime = getTimestamp();
							pendingFrame++;
							if (videoInfo.fps == 0 && (codec.frameTimestamp - frameEndTimestamp) > 0) {
								// WebM doesn't encode a frame rate
								targetPerFrameTime = (codec.frameTimestamp - frameEndTimestamp) * 1000;
							}
							totalFrameTime += targetPerFrameTime;
							totalFrameCount++;
							frameEndTimestamp = codec.frameTimestamp;
							var pendingFramePing = false;
							codec.decodeFrame(function processingDecodeFrame(ok) {
								log('decoded frame');
								var delta = getTimestamp() - videoStartTime;
								videoDecodingTime += delta;
								lastFrameDecodeTime += delta;
								if (ok) {
									// Save the buffer until it's time to draw
									yCbCrBuffer = codec.frameBuffer;
								} else {
									// Bad packet or something.
									log('Bad video packet or something');
								}
								pendingFrame--;
								if (!isProcessing()) {
									pingProcessing();
								}
							});
							if (!isProcessing()) {
								pingProcessing();
							}

						} else if (readyForAudioDecode) {

							log('ready for audio');

							var audioStartTime = getTimestamp();
							pendingAudio++;
							audioEndTimestamp = codec.audioTimestamp;
							codec.decodeAudio(function processingDecodeAudio(ok) {
								log('decoded audio');
								var delta = getTimestamp() - audioStartTime;
								audioDecodingTime += delta;
								lastFrameDecodeTime += delta;

								if (ok) {
									var buffer = codec.audioBuffer;
									if (buffer) {
										// Keep track of how much time we spend queueing audio as well
										// This is slow when using the Flash shim on IE 10/11
										bufferTime += time(function() {
											audioFeeder.bufferData(buffer);
										});
										audioBufferedDuration += (buffer[0].length / audioInfo.rate) * 1000;
									}
								}
								pendingAudio--;
								if (!isProcessing()) {
									pingProcessing();
								}
							});
							if (!isProcessing()) {
								pingProcessing();
							}

						} else {

							var nextDelay = Math.min.apply(Math, nextDelays);
							if (nextDelays.length > 0) {
								log('idle: ' + nextDelay + ' - ' + nextDelays.join(','));
								if (!codec.hasVideo) {
									framesProcessed++; // pretend!
									doFrameComplete();
								}
								pingProcessing(Math.max(0, nextDelay));
							} else if (pendingFrame || pendingAudio) {
								log('waiting on pending events');
							} else {
								log('we may be lost');
							}
						}
					}
				}
			});

		} else {

			throw new Error('Unexpected OGVPlayer state ' + state);

		}

		depth--;
	}

	/**
	 * Are we waiting on an async operation we can't interrupt?
	 */
	function isProcessing() {
		return waitingOnInput || (codec && codec.processing);
	}

	function readBytesAndWait() {
		waitingOnInput = true;
		stream.readBytes();
	}

	function pingProcessing(delay) {
		if (delay === undefined) {
			delay = -1;
		}
		if (isProcessing()) {
			throw new Error('REENTRANCY FAIL: asked to pingProcessing() while already waiting');
		}
		if (nextProcessingTimer) {
			//log('canceling old processing timer');
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
		}
		var fudge = -1 / 256;
		if (delay > fudge) {
			//log('pingProcessing delay: ' + delay);
			nextProcessingTimer = setTimeout(doProcessing, delay);
		} else {
			//log('pingProcessing tail call (' + delay + ')');
			tailCall(doProcessing);
		}
	}

	var videoInfo,
		audioInfo;

	function startProcessingVideo() {
		if (started || codec) {
			return;
		}

		framesProcessed = 0;
		demuxingTime = 0;
		videoDecodingTime = 0;
		audioDecodingTime = 0;
		bufferTime = 0;
		drawingTime = 0;
		started = true;
		ended = false;

		codec = new codecClass(codecOptions);
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
	 */
	self.load = function() {
		if (currentSrc == self.src) {
			// already loaded.
			return;
		}

		if (started) {
			stopVideo();
		}

		currentSrc = '' + self.src;
		stream = new StreamFile({
			url: currentSrc,
			bufferSize: 65536 * 4,
			onstart: function() {
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
				console.log("reading error: " + err);
			}
		});
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
		if (!audioOptions.audioContext) {
			OGVPlayer.initSharedAudioContext();
		}

		if (paused) {
			startedPlaybackInDocument = document.body.contains(self);

			paused = false;

			if (started) {

				log('.play() while already started');

				actionQueue.push(function() {
					startPlayback();
					fireEvent('play');
					pingProcessing(0);
				});
				if (isProcessing()) {
					// waiting on the codec already
				} else {
					pingProcessing();
				}

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
			demuxingTime: demuxingTime,
			videoDecodingTime: videoDecodingTime,
			audioDecodingTime: audioDecodingTime,
			bufferTime: bufferTime,
			drawingTime: drawingTime,
			droppedAudio: droppedAudio,
			delayedAudio: delayedAudio,
			jitter: totalJitter / framesProcessed
		};
	};
	self.resetPlaybackStats = function() {
		framesProcessed = 0;
		playTime = 0;
		demuxingTime = 0;
		videoDecodingTime = 0;
		audioDecodingTime = 0;
		bufferTime = 0;
		drawingTime = 0;
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
		if (!stream) {
			paused = true;
			self.load();
		} else if (!paused) {
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
	self.src = "";

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
				thumbnail.addEventListener('load', function() {
					OGVPlayer.styleManager.appendRule('.' + instanceId, {
						width: thumbnail.naturalWidth + 'px',
						height: thumbnail.naturalHeight + 'px'
					});
					self.appendChild(thumbnail);
					OGVPlayer.updatePositionOnResize();
				});
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
			return null;
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
		sheet.insertRule(rule, sheet.length - 1);
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
