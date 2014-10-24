/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
OgvJsTimeRanges = window.OgvJsTimeRanges = function(ranges) {
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
	}
	return this;
}

/**
 * Player class -- instantiate one of these to get an 'ogvjs' HTML element
 * which has a similar interface to the HTML audio/video elements.
 *
 * @param options: optional dictionary of options:
 *                 'base': string; base URL for additional resources, such as Flash audio shim
 *                 'webGL': bool; pass true to use WebGL acceleration if available
 *                 'forceWebGL': bool; pass true to require WebGL even if not detected
 */
OgvJsPlayer = window.OgvJsPlayer = function(options) {
	options = options || {};
	var webGLdetected = WebGLFrameSink.isAvailable();
	var useWebGL = !!options.webGL && webGLdetected;
	if(!!options.forceWebGL) {
		useWebGL = true;
		if(!webGLdetected) {
			console.log("No support for WebGL detected, but WebGL forced on!");
		}
	}
	
	var State = {
		INITIAL: 'INITIAL',
		HEADERS: 'HEADERS',
		PLAYING: 'PLAYING',
		PAUSED: 'PAUSED',
		SEEKING: 'SEEKING',
		ENDED: 'ENDED'
	}, state = State.INITIAL;
	
	var audioOptions = {};
	if (typeof options.base === 'string') {
		// Pass the resource dir down to AudioFeeder,
		// so it can load the dynamicaudio.swf
		audioOptions.base = options.base;
	}
	if (typeof options.audioContext !== 'undefined') {
		// Try passing a pre-created audioContext in?
		audioOptions.audioContext = options.audioContext;
	}
	
	var canvas = document.createElement('canvas');
	var frameSink;
	
	// Return a magical custom element!
	var self = document.createElement('ogvjs');
	self.style.display = 'inline-block';
	self.style.position = 'relative';
	self.style.width = '0px'; // size will be expanded later
	self.style.height = '0px';

	canvas.style.position = 'absolute';
	canvas.style.top = '0';
	canvas.style.left = '0';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	self.appendChild(canvas);

	var getTimestamp;
	if (window.performance === undefined || window.performance.now === undefined) {
		getTimestamp = Date.now;
	} else {
		getTimestamp = window.performance.now.bind(window.performance);
	}

	var placeboCodec, codec, audioFeeder;
	var stream, byteLength = 0, nextProcessingTimer, paused = true;
	var muted = false;

	var framesPlayed = 0;
	// Benchmark data, exposed via getPlaybackStats()
	var framesProcessed = 0, // frames
		targetPerFrameTime = 1000 / 60, // ms
		demuxingTime = 0, // ms
		videoDecodingTime = 0, // ms
		audioDecodingTime = 0, // ms
		bufferTime = 0, // ms
		drawingTime = 0, // ms
		totalJitter = 0; // sum of ms we're off from expected frame delivery time
	// Benchmark data that doesn't clear
	var droppedAudio = 0; // number of times we were starved for audio

	function stopVideo() {
		// kill the previous video if any
		paused = true; // ?
		ended = true;
		
		continueVideo = null;
		
		if (stream) {
			stream.abort();
			stream = null;
		}
		if (placeboCodec) {
			placeboCodec.destroy();
			placeboCodec = null;
		}
		if (codec) {
			codec.destroy();
			codec = null;
		}
		if (audioFeeder) {
			audioFeeder.close();
			audioFeeder = null;
		}
		if (nextProcessingTimer) {
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
		}
	}
	
	function togglePauseVideo() {
		if (self.paused) {
			self.play();
		} else {
			self.pause();
		}
	}
	
	var continueVideo = null;
	
	var lastFrameTime = getTimestamp(),
		frameEndTimestamp = 0.0,
		yCbCrBuffer = null;
	var lastFrameDecodeTime = 0.0;		
	var targetFrameTime;
	var lastFrameTimestamp = 0.0;

	function processFrame() {
		yCbCrBuffer = codec.dequeueFrame();
		frameEndTimestamp = yCbCrBuffer.timestamp;
	}

	function drawFrame() {
		if (thumbnail) {
			self.removeChild(thumbnail);
			thumbnail = null;
		}

		var start, delta;

		start = getTimestamp();

		frameSink.drawFrame(yCbCrBuffer);

		delta = getTimestamp() - start;
		lastFrameDecodeTime += delta;
		drawingTime += delta;

		framesProcessed++;
		framesPlayed++;

		doFrameComplete();
	}

	function doFrameComplete() {
		if (!document.body.contains(self)) {
			// We've been de-parented since we last ran
			// Stop playback at next opportunity!
			setTimeout(function() {
				self.stop();
			}, 0);
		}

		var newFrameTimestamp = getTimestamp(),
			wallClockTime = newFrameTimestamp - lastFrameTimestamp,
			jitter = Math.abs(wallClockTime - 1000 / fps);
		totalJitter += jitter;

		if (self.onframecallback) {
			self.onframecallback({
				cpuTime: lastFrameDecodeTime,
				clockTime: wallClockTime
			});
		}
		lastFrameDecodeTime = 0;
		lastFrameTimestamp = newFrameTimestamp;
	}
	
	var Bisect = {
		LEFT: 'LEFT',
		RIGHT: 'RIGHT'
	};
	var bisectStart = 0,
		bisectEnd = 0,
		bisectPosition = 0,
		seekTargetTime = 0.0;
	function startBisect() {
		if (stream.bytesTotal == 0) {
			throw new Error('Cannot bisect a non-seekable stream');
		}
		bisectStart = 0;
		bisectEnd = stream.bytesTotal - 1;
		iterateBisect();
	}
	function continueBisect(direction) {
		if (direction === Bisect.LEFT) {
			bisectEnd = bisectPosition;
		} else if (direction === Bisect.RIGHT) {
			bisectStart = bisectPosition;
		} else {
			throw new Error('invalid direction to continueBisect');
		}
		return iterateBisect();
	}
	function iterateBisect() {
		var newBisectPosition = Math.floor((bisectStart + bisectEnd) / 2);
		if (newBisectPosition == bisectPosition) {
			// this is as good as we're gonna get
			return false;
		} else {
			bisectPosition = newBisectPosition;
			console.log('iterateBisect', bisectStart, bisectPosition, bisectEnd);
			stream.seek(bisectPosition);
			return true;
		}
	}
	function drainBuffers() {
		// Drain the existing buffers before we start processing seek bisection
		codec.flush();
	}
	
	/**
	 * In IE, pushing data to the Flash shim is expensive.
	 * Combine multiple small Vorbis packet outputs into
	 * larger buffers so we don't have to make as many calls.
	 */
	function joinAudioBuffers(buffers) {
		if (buffers.length == 1) {
			return buffers[0];
		}
		var sampleCount = 0,
			channelCount = buffers[0].length,
			i,
			c,
			out = [];
		for (i = 0; i < buffers.length; i++) {
			sampleCount += buffers[i][0].length;
		}
		for (c = 0; c < channelCount; c++) {
			var channelOut = new Float32Array(sampleCount);
			var position = 0;
			for (i = 0; i < buffers.length; i++) {
				var channelIn = buffers[i][c];
				channelOut.set(channelIn, position);
				position += channelIn.length;
			}
			out.push(channelOut);
		}
		return out;
	}

	function doProcessing() {
		nextProcessingTimer = null;
		
		var audioBuffers = [];
		function queueAudio() {
			if (audioBuffers.length > 0) {
				var start = getTimestamp();
				audioFeeder.bufferData(joinAudioBuffers(audioBuffers));
				var delta = (getTimestamp() - start);
				lastFrameDecodeTime += delta;
				bufferTime += delta;

				if (!codec.hasVideo) {
					framesProcessed++; // pretend!
					doFrameComplete();
				}
			}
		}
		var audioBufferedDuration = 0,
			decodedSamples = 0;
		if (codec.hasAudio) {
			var audioState = audioFeeder.getPlaybackState();
			audioBufferedDuration = (audioState.samplesQueued / audioFeeder.targetRate) * 1000;
			droppedAudio = audioState.dropped;
		}
		
		var n = 0;
		while (true) {
			n++;
			if (n > 100) {
				//throw new Error("Got stuck in the loop!");
				console.log("Got stuck in the loop!");
				pingProcessing(10);
				return;
			}

			if (state == State.SEEKING) {
				if (!codec.process()) {
					stream.readBytes();
					return;
				}
				if (codec.hasVideo) {
					// seek according to frames, look for the last keyframe
					if (codec.frameReady) {
						//var fudgeFactor = (0.5 / videoInfo.fps);
						var fudgeFactor = 0.25; // quarter-second resolution is close enough
						if (codec.frameTimestamp < 0) {
							// Invalid granule pos? um.
							// move on past it
							codec.discardFrame();
						} else if (codec.frameTimestamp > seekTargetTime + fudgeFactor) {
							console.log('frame too high: ', codec.frameTimestamp, seekTargetTime, fudgeFactor);
							codec.flush();
							if (continueBisect(Bisect.LEFT)) {
								// wait for new data to come in
							} else {
								console.log('gave up on bisect left');
								state = State.PLAYING;
							}
						} else if (codec.frameTimestamp < seekTargetTime - fudgeFactor) {
							console.log('frame too low: ', codec.frameTimestamp, seekTargetTime, fudgeFactor);
							codec.flush();
							if (continueBisect(Bisect.RIGHT)) {
								// wait for new data to come in
							} else {
								console.log('gave up on bisect right');
								state = State.PLAYING;
							}
						} else {
							// We found it!
							console.log('frame FOUND: ', codec.frameTimestamp, seekTargetTime, fudgeFactor);
							if (codec.keyframeTimestamp < codec.frameTimestamp) {
								console.log('keyframe is ' + codec.keyframeTimestamp);
								// @todo seek again, to the keyframe
								state = State.PLAYING;
								frameEndTimestamp = codec.frameTimestamp;
							}
						}
					} else {
						// Keep reading for more data.
					}
				} else if (codec.hasAudio) {
					throw new Error('seeking not yet supported on audio-only');
				}
				return;
			}

			// Process until we run out of data or
			// completely decode a video frame...
			var currentTime = getTimestamp();
			var start = getTimestamp();
	
			var hasAudio = codec.hasAudio,
				hasVideo = codec.hasVideo;
			if (placeboCodec) {
				placeboCodec.process();
			}
			var more = codec.process();
			
			if (hasAudio != codec.hasAudio || hasVideo != codec.hasVideo) {
				// we just fell over from headers into content; reinit
				lastFrameTimestamp = getTimestamp();
				targetFrameTime = lastFrameTimestamp + 1000.0 / fps
				pingProcessing();
				return;
			}

			var delta = (getTimestamp() - start);
			lastFrameDecodeTime += delta;
			demuxingTime += delta;

			if (!more) {
				queueAudio();
				if (stream) {
					// Ran out of buffered input
					stream.readBytes();
				} else {
					// Ran out of stream!
					var finalDelay = 0;
					if (hasAudio) {
						// This doesn't seem to be enough with Flash audio shim.
						// Not quite sure why.
						finalDelay = audioBufferedDuration;
					}
					console.log('End of stream reached in ' + finalDelay + ' ms.');
					setTimeout(function() {
						//stopVideo();
						ended = true;
						if (self.onended) {
							self.onended();
						}
					}, finalDelay);
				}
				return;
			}
			
			if ((hasAudio || hasVideo) && !(codec.audioReady || codec.frameReady)) {
				// Have to process some more pages to find data. Continue the loop.
				continue;
			}

						
			if (hasAudio) {
				// Drive on the audio clock!
				var fudgeDelta = 0.1,
					//readyForAudio = audioState.samplesQueued <= (audioFeeder.bufferSize * 2),
					//readyForFrame = (audioState.playbackPosition >= frameEndTimestamp);
					readyForAudio = audioState.samplesQueued <= (audioFeeder.bufferSize * 2),
					frameDelay = (frameEndTimestamp - audioState.playbackPosition) * 1000,
					readyForFrame = (frameDelay <= fudgeDelta);
				var startTimeSpent = getTimestamp();
				if (codec.audioReady && readyForAudio) {
					var start = getTimestamp();
					var ok = codec.decodeAudio();
					var delta = (getTimestamp() - start);
					lastFrameDecodeTime += delta;
					audioDecodingTime += delta;

					var start = getTimestamp();
					if (ok) {
						var buffer = codec.dequeueAudio();
						//audioFeeder.bufferData(buffer);
						audioBuffers.push(buffer);
						audioBufferedDuration += (buffer[0].length / audioInfo.rate) * 1000;
						decodedSamples += buffer[0].length;
					}
				}
				if (codec.frameReady && readyForFrame) {
					var start = getTimestamp();
					var ok = codec.decodeFrame();
					var delta = (getTimestamp() - start);
					lastFrameDecodeTime += delta;
					videoDecodingTime += delta;
					if (ok) {
						processFrame();
						drawFrame();
					} else {
						// Bad packet or something.
						console.log('Bad video packet or something');
					}
					targetFrameTime = currentTime + 1000.0 / fps;
				}
			
				// Check in when all audio runs out
				var bufferDuration = (audioFeeder.bufferSize / audioFeeder.targetRate) * 1000;
				var nextDelays = [];
				if (audioBufferedDuration <= bufferDuration * 2) {
					// NEED MOAR BUFFERS
				} else {
					// Check in when the audio buffer runs low again...
					nextDelays.push(bufferDuration / 2);
					
					if (hasVideo) {
						// Check in when the next frame is due
						// Subtract time we already spent decoding
						var deltaTimeSpent = getTimestamp() - startTimeSpent;
						nextDelays.push(frameDelay - deltaTimeSpent);
					}
				}
				
				//console.log(n, audioState.playbackPosition, frameEndTimestamp, audioBufferedDuration, bufferDuration, frameDelay, '[' + nextDelays.join("/") + ']');
				var nextDelay = Math.min.apply(Math, nextDelays);
				if (nextDelays.length > 0) {
					if (placeboCodec) {
						// We've primed the JIT compiler... or something... by now;
						// throw away the placebo copy.
						placeboCodec.destroy();
						placeboCodec = null;
					}

					// Keep track of how much time we spend queueing audio as well
					// This is slow when using the Flash shim on IE 10/11
					var start = getTimestamp();
					queueAudio();
					var delta = getTimestamp() - start;
					pingProcessing(Math.max(0, nextDelay - delta));
					return;
				}
			} else if (hasVideo) {
				// Video-only: drive on the video clock
				if (codec.frameReady && getTimestamp() >= targetFrameTime) {
					if (placeboCodec) {
						// We've primed the JIT compiler... or something... by now;
						// throw away the placebo copy.
						placeboCodec.destroy();
						placeboCodec = null;
					}

					// it's time to draw
					var start = getTimestamp();
					var ok = codec.decodeFrame();
					var delta = (getTimestamp() - start);
					lastFrameDecodeTime += delta;
					videoDecodingTime += delta;
					if (ok) {
						processFrame();
						drawFrame();
						targetFrameTime += 1000.0 / fps;
						pingProcessing(0);
					} else {
						console.log('Bad video packet or something');
						pingProcessing(Math.max(0, targetFrameTime - getTimestamp()));
					}
				} else {
					// check in again soon!
					pingProcessing(Math.max(0, targetFrameTime - getTimestamp()));
				}
				return;
			} else {
				// Ok we're just waiting for more input.
				console.log('Still waiting for headers...');
			}
		}
	}

	function pingProcessing(delay) {
		if (delay === undefined) {
			delay = -1;
		}
		if (delay >= 0) {
			if (nextProcessingTimer) {
				// already scheduled
				return;
			}
			//console.log('delaying for ' + delay);
			nextProcessingTimer = setTimeout(doProcessing, delay);
		} else {
			if (nextProcessingTimer) {
				clearTimeout(nextProcessingTimer);
			}
			doProcessing(); // warning: tail recursion is possible
		}
	}

	var fps = 60;

	var videoInfo,
		audioInfo;

	function playVideo() {
		paused = false;
		
		var options = {};
		
		// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1
		if (navigator.userAgent.match(/Version\/6\.0\.[0-9a-z.]+ Safari/)) {
			// Something may be wrong with the JIT compiler in Safari 6.0;
			// when we decode Vorbis with the debug console closed it falls
			// into 100% CPU loop and never exits.
			//
			// Blacklist audio decoding for this browser.
			//
			// Known working in Safari 6.1 and 7.
			options.audio = false;
			console.log('Audio disabled due to bug on Safari 6.0');
		}
		
		framesProcessed = 0;
		demuxingTime = 0;
		videoDecodingTime = 0;
		audioDecodingTime = 0;
		bufferTime = 0;
		drawingTime = 0;

		// There's some kind of problem with the JIT in iOS 7 Safari
		// that sometimes trips up on optimized Vorbis builds, at least
		// on my iPad 3 (A5X SoC).
		//
		// Exercising some of the ogg & vorbis library code paths with
		// a second decoder for the first few packets of data seems to
		// be enough to work around this.
		//
		// Non-deterministic debugging ROCKS!
		//
		placeboCodec = new OgvJs(options);

		codec = new OgvJs(options);
		codec.oninitvideo = function(info) {
			videoInfo = info;
			fps = info.fps;
			targetPerFrameTime = 1000 / fps;
			
			if (width == 0) {
				self.style.width = info.picWidth + 'px';
			}
			if (height == 0) {
				self.style.height = info.picHeight + 'px';
			}
			
			canvas.width = info.picWidth;
			canvas.height = info.picHeight;
			console.log('useWebGL is', useWebGL);
			if (useWebGL) {
				frameSink = new WebGLFrameSink(canvas, videoInfo);
			} else {
				frameSink = new FrameSink(canvas, videoInfo);
			}
		};
		codec.oninitaudio = function(info) {
			audioInfo = info;
			audioFeeder.init(info.channels, info.rate);
		};
		codec.onloadedmetadata = function() {
			state = State.PLAYING;
			if (self.onloadedmetadata) {
				self.onloadedmetadata();
			}
		};

		continueVideo = function() {
			if (audioFeeder) {
				audioFeeder.onstarved = function() {
					pingProcessing();
				};
			}
			pingProcessing();
		}

		audioFeeder = new AudioFeeder( audioOptions );
		if (muted) {
			audioFeeder.mute();
		}
		audioFeeder.onstarved = function() {
			// If we're in a background tab, timers may be throttled.
			// When audio buffers run out, go decode some more stuff.
			pingProcessing();
		};
		audioFeeder.waitUntilReady(function(feeder) {
			// Start reading!
			if (started) {
				stream.readBytes();
			} else {
				onstart = function() {
					stream.readBytes();
				};
			}
		});
	}
	
	var started = false;
	var onstart;
	
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
				started = true;
				byteLength = stream.bytesTotal;
				console.log('byteLength: ' + byteLength);
				if (onstart) {
					onstart();
				}
			},
			onread: function(data) {
				// Pass chunk into the codec's buffer
				codec.receiveInput(data);
				if (placeboCodec) {
					placeboCodec.receiveInput(data);
				}

				// Continue the read/decode/draw loop...
				pingProcessing();
			},
			ondone: function() {
				console.log("reading^H^H^^H^H buffering? done.");
				//throw new Error('wtf is this');
				//stream = null;
				
				// Let the read/decode/draw loop know we're out!
				pingProcessing();
			},
			onerror: function(err) {
				console.log("reading error: " + err);
			}
		});
		
		paused = true;
	};
	
	/**
	 * HTMLMediaElement canPlayType method
	 */
	self.canPlayType = function(type) {
		// @todo: implement better parsing
		if (type === 'audio/ogg; codecs="vorbis"') {
			return 'probably';
		} else if (type.match(/^audio\/ogg\b/)) {
			return 'maybe';
		} else if (type === 'video/ogg; codecs="theora"') {
			return 'probably';
		} else if (type === 'video/ogg; codecs="theora,vorbis"') {
			return 'probably';
		} else if (type.match(/^video\/ogg\b/)) {
			return 'maybe';
		} else {
			return '';
		}
	};
	
	/**
	 * HTMLMediaElement play method
	 */
	self.play = function() {
		if (!stream) {
			self.load();
		}
		
		if (paused) {
			paused = false;
			if (continueVideo) {
				continueVideo();
			} else {
				playVideo();
			}
			if (self.onplay) {
				self.onplay();
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
			demuxingTime: demuxingTime,
			videoDecodingTime: videoDecodingTime,
			audioDecodingTime: audioDecodingTime,
			bufferTime: bufferTime,
			drawingTime: drawingTime,
			droppedAudio: droppedAudio,
			jitter: totalJitter / framesProcessed
		};
	};
	self.resetPlaybackStats = function() {
		framesProcessed = 0;
		demuxingTime = 0;
		videoDecodingTime = 0;
		audioDecodingTime = 0;
		bufferTime = 0;
		drawingTime = 0;
		totalJitter = 0;
	};
	
	/**
	 * HTMLMediaElement pause method
	 */
	self.pause = function() {
		if (!stream) {
			console.log('initializing stream');
			paused = true;
			self.load();
		} else if (!paused) {
			console.log('pausing');
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
			if (audioFeeder) {
				audioFeeder.onstarved = null;
			}
			paused = true;
			if (self.onpause) {
				self.onpause();
			}
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
	 */
	Object.defineProperty(self, "buffered", {
		get: function getBuffered() {
			var estimatedBufferTime;
			if (stream && byteLength && self.durationHint) {
				estimatedBufferTime = (stream.bytesBuffered / byteLength) * self.durationHint;
			} else {
				estimatedBufferTime = 0;
			}
			return new OgvJsTimeRanges([[0, estimatedBufferTime]]);
		}
	});
	
	/**
	 * HTMLMediaElement currentTime property
	 */
	Object.defineProperty(self, "currentTime", {
		get: function getCurrentTime() {
			if (codec && codec.hasAudio) {
				return audioFeeder.getPlaybackState().playbackPosition;
			} else if (codec && codec.hasVideo) {
				return frameEndTimestamp;
			} else {
				return 0;
			}
		},
		set: function setCurrentTime(val) {
			if (stream && byteLength && self.durationHint) {
				state = State.SEEKING;
				// haaaaaack!
				//var estimatedBufferBytes = Math.floor((val / self.durationHint) * byteLength);
				//stream.seek(estimatedBufferBytes);
				seekTargetTime = val;
				drainBuffers();
				startBisect();
			}
		}
	});
	
	/**
	 * custom durationHint property
	 */
	self.durationHint = null;
	
	/**
	 * HTMLMediaElement duration property
	 */
	Object.defineProperty(self, "duration", {
		get: function getDuration() {
			if (codec && (codec.hasAudio || codec.hasVideo)) {
				if (self.durationHint) {
					return self.durationHint;
				} else {
					// @todo figure out how to estimate it
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
	
	var poster, thumbnail;
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
				thumbnail.onload = function() {
					if (width == 0) {
						self.style.width = thumbnail.naturalWidth + 'px';
					}
					if (height == 0) {
						self.style.height = thumbnail.naturalHeight + 'px';
					}
				}
				self.appendChild(thumbnail);
			}
		}
	});
	
	// Video metadata properties...
	Object.defineProperty(self, "videoWidth", {
		get: function getVideoWidth() {
			if (videoInfo) {
				return videoInfo.picWidth;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "videoHeight", {
		get: function getVideoHeight() {
			if (videoInfo) {
				return videoInfo.picHeight;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "ogvjsVideoFrameRate", {
		get: function getOgvJsVideoFrameRate() {
			if (videoInfo) {
				return videoInfo.fps;
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
}
