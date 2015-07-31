/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
OGVTimeRanges = window.OGVTimeRanges = function(ranges) {
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
OGVPlayer = window.OGVPlayer = function(options) {
	options = options || {};

	var instanceId = 'ogvjs' + (++OGVPlayer.instanceCount);

	var codecClassName = null,
		codecClass = null,
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

		if (typeof window.Event == 'function') {
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

		self.dispatchEvent(event);
	}

	var codec,
		actionQueue = [],
		audioFeeder;
	var muted = false,
		initialPlaybackPosition = 0.0,
		initialPlaybackOffset = 0.0;
	function initAudioFeeder() {
		audioFeeder = new AudioFeeder( audioOptions );
		if (muted) {
			audioFeeder.mute();
		}
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
	}
	
	function stopPlayback() {
		if (audioFeeder) {
			audioFeeder.stop();
		}
		initialPlaybackOffset = getPlaybackTime();
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

	var stream,
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

	function stopVideo() {
		console.log("STOPPING");
		// kill the previous video if any
		state = State.INITIAL;
		started = false;
		paused = true;
		ended = true;
		continueVideo = null;
		frameEndTimestamp = 0.0;
		audioEndTimestamp = 0.0;
		lastFrameDecodeTime = 0.0;
		
		if (stream) {
			stream.abort();
			stream = null;
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
	}
	
	var continueVideo = null;
	
	var lastFrameTime = getTimestamp(),
		frameEndTimestamp = 0.0,
		audioEndTimestamp = 0.0,
		yCbCrBuffer = null;
	var lastFrameDecodeTime = 0.0;		
	var lastFrameTimestamp = 0.0;

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
		useTailCalls = true,
		pendingFrame = 0,
		pendingAudio = 0;

	function doProcessing() {
		nextProcessingTimer = null;
		depth++;
		if (depth > 1 && !useTailCalls) {
			throw new Error('REENTRANCY FAIL: doProcessing recursing unexpectedly');
		}
		if (isProcessing()) {
			throw new Error('REENTRANCY FAIL: doProcessing called while waiting on codec or input');
		}

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
					console.log('reading more cause we are out of data');
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
						if (lastSeenTimestamp > 0) {
							duration = lastSeenTimestamp;
						}

						// Ok, seek back to the beginning and resync the streams.
						state = State.LOADED;
						codec.flush(function() {
							stream.seek(0);
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
			fireEvent('loadedmetadata');
			if (paused) {
				// Paused? stop here.
			} else {
				// Not paused? Continue on to play processing.
				pingProcessing();
			}

		} else if (state == State.READY) {

			state = State.PLAYING;
			lastFrameTimestamp = getTimestamp();
			if (codec.hasAudio) {
				initAudioFeeder();
				audioFeeder.waitUntilReady(function() {
					startPlayback(0.0);
					pingProcessing(0);
				});
			} else {
				startPlayback(0.0);
				pingProcessing(0);
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
					if (stream) {
						// Ran out of buffered input
						readBytesAndWait();
					} else {
						// Ran out of stream!
						var finalDelay = 0;
						if (codec.hasAudio) {
							// This doesn't seem to be enough with Flash audio shim.
							// Not quite sure why.
							finalDelay = audioBufferedDuration;
						}
						setTimeout(function() {
							console.log("ENDING ALREADY");
							stopVideo();
							ended = true;
							fireEvent('ended');
						}, finalDelay);
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
							var bufferDuration = (audioFeeder.bufferSize / audioFeeder.targetRate);
							readyForAudioDecode = codec.audioReady && (audioBufferedDuration <= (bufferDuration * 2));

							// Check in when all audio runs out
							if (pendingAudio) {
								// We'll check in when done decoding
							} else if (!codec.audioReady) {
								// NEED MOAR BUFFERS
								nextDelays.push(-1);
							} else {
								// Check in when the audio buffer runs low again...
								nextDelays.push((audioBufferedDuration - bufferDuration * 2) * 1000);
								//nextDelays.push(bufferDuration * 1000 / 4);
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
									console.log('Bad video packet or something');
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
								console.log('we may be lost');
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
		if (delay > fudge || !useTailCalls) {
			//log('pingProcessing delay: ' + delay);
			nextProcessingTimer = setTimeout(doProcessing, delay);
		} else {
			//log('pingProcessing tail call (' + delay + ')');
			doProcessing(); // warning: tail recursion is possible
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
		codecClassName = 'OGVWrapperCodec';

		// @todo fix detection proper
		if (enableWebM && self.src.match(/\.webm$/i)) {
			codecOptions.type = 'video/webm';
		} else {
			codecOptions.type = 'video/ogg';
		}

		OGVLoader.loadClass(codecClassName, function(classObj) {
			codecClass = classObj;
			callback();
		});
	}

	/**
	 * HTMLMediaElement load method
	 */
	self.load = function() {
		if (stream) {
			// already loaded.
			return;
		}
	
		started = false;
		stream = new StreamFile({
			url: self.src,
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
				actionQueue.push(function() {
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
				if (state == State.SEEKING) {
					pingProcessing();
				} else if (state == State.SEEKING_END) {
					pingProcessing();
				} else {
					console.log('closing stream (done)');
					stream = null;

					if (isProcessing()) {
						// We're waiting on the codec already...
					} else {
						// Let the read/decode/draw loop know we're out!
						pingProcessing();
					}
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
		
		if (!stream) {
			self.load();
		}
		
		if (paused) {
			startedPlaybackInDocument = document.body.contains(self);
			paused = false;
			if (continueVideo) {
				continueVideo();
			} else {
				continueVideo = function() {
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
				};
				if (!started) {
					loadCodec(startProcessingVideo);
				} else {
					continueVideo();
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
		get: function getEnded() {
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
				if (muted) {
					audioFeeder.mute();
				} else {
					audioFeeder.unmute();
				}
			}
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
	Object.defineProperty(self, "width", {
		get: function getWidth() {
			return width;
		},
		set: function setWidth(val) {
			width = parseInt(val, 10);
			self.style.width = width + 'px';
		}
	});
	
	Object.defineProperty(self, "height", {
		get: function getHeight() {
			return height;
		},
		set: function setHeight(val) {
			height = parseInt(val, 10);
			self.style.height = height + 'px';
		}
	});

	// Events!

	/**
	 * custom onframecallback, takes frame decode time in ms
	 */
	self.onframecallback = null;
	
	/**
	 * Called when all metadata is available.
	 * Note in theory we must know 'duration' at this point.
	 */
	self.onloadedmetadata = null;
	
	/**
	 * Called when we start playback
	 */
	self.onplay = null;
	
	/**
	 * Called when we get paused
	 */
	self.onpause = null;
	
	/**
	 * Called when playback ends
	 */
	self.onended = null;
	
	return self;
};

OGVPlayer.initSharedAudioContext = function() {
	AudioFeeder.initSharedAudioContext();
};

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
