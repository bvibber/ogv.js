/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
function OgvJsTimeRanges(ranges) {
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

function OgvJsPlayer(canvas) {
	var ctx = canvas.getContext('2d');

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
	if (!requestAnimationFrame) {
		throw new Error("No requestAnimationFrame available!");
	}

	var getTimestamp;
	if (window.performance === undefined) {
		getTimestamp = Date.now;
	} else {
		getTimestamp = window.performance.now.bind(window.performance);
	}

	var self = this;
	var codec, audioFeeder;
	var stream, nextProcessingTimer, paused = true;
	var muted = false;

	var framesPlayed = 0;
	// Benchmark data, exposed via getPlaybackStats()
	var framesProcessed = 0, // frames
		demuxingTime = 0, // seconds
		videoDecodingTime = 0, // ms
		audioDecodingTime = 0, // ms
		bufferTime = 0, // ms
		colorTime = 0, // ms
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
		if (codec) {
			codec.destroy();
			codec = null;
		}
		if (audioFeeder) {
			audioFeeder.close();
			audioFeeder = null;
		}
		if (nextProcessingTimer) {
			//cancelAnimationFrame(nextProcessingTimer);
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
		frameScheduled = false,
		imageData = null,
		yCbCrBuffer = null;

	function prepareFrame() {
		yCbCrBuffer = codec.dequeueFrame();
		frameEndTimestamp = yCbCrBuffer.timestamp;
	}
	
	function drawFrame() {
		var start, delta;

		start = getTimestamp();
		
		convertYCbCr(yCbCrBuffer, imageData.data);
		
		delta = getTimestamp() - start;
		colorTime += delta;
		lastFrameDecodeTime += delta;

		start = getTimestamp();
		ctx.putImageData(imageData,
						 0, 0,
						 videoInfo.picX, videoInfo.picY,
						 videoInfo.picWidth, videoInfo.picHeight);
		delta = getTimestamp() - start;

		lastFrameDecodeTime += delta;
		drawingTime += delta;
		framesProcessed++;
		framesPlayed++;
	}
	
	var lastFrameDecodeTime = 0.0;		
	var targetFrameTime;
	
	var lastFrameTimestamp = 0.0;
	function doDrawFrame() {
		prepareFrame();
		drawFrame();
		if (self.onframecallback) {
			var newFrameTimestamp = getTimestamp(),
				wallClockTime = newFrameTimestamp - lastFrameTimestamp,
				jitter = Math.abs(wallClockTime - 1000 / videoInfo.fps);
			totalJitter += jitter;

			self.onframecallback(lastFrameDecodeTime);
			lastFrameDecodeTime = 0;
			lastFrameTimestamp = newFrameTimestamp;
		}
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
					if (self.onframecallback) {
						self.onframecallback(lastFrameDecodeTime);
						lastFrameDecodeTime = 0;
					}
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
			// Process until we run out of data or
			// completely decode a video frame...
			var currentTime = getTimestamp();
			var start = getTimestamp();
	
			var hasAudio = codec.hasAudio,
				hasVideo = codec.hasVideo;
			more = codec.process();
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
						if (self.durationHint) {
							finalDelay = self.durationHint * 1000 - audioState.playbackPosition;
						} else {
							// This doesn't seem to be enough with Flash audio shim.
							// Not quite sure why.
							finalDelay = audioBufferedDuration;
						}
					}
					console.log('End of stream reached in ' + finalDelay + ' ms.');
					setTimeout(function() {
						stopVideo();
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
						doDrawFrame();
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
					nextDelays.push(bufferDuration);
					
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
					// Keep track of how much time we spend queueing audio as well
					// This is slow when using the Flash shim on IE 10/11
					var start = getTimestamp();
					queueAudio();
					var delta = getTimestamp() - start;
					pingProcessing(nextDelay - delta);
					return;
				}
			} else if (hasVideo) {
				// Video-only: drive on the video clock
				if (codec.frameReady && getTimestamp() >= targetFrameTime) {
					// it's time to draw
					var start = getTimestamp();
					var ok = codec.decodeFrame();
					var delta = (getTimestamp() - start);
					lastFrameDecodeTime += delta;
					videoDecodingTime += delta;
					if (ok) {
						doDrawFrame();
						targetFrameTime += 1000.0 / fps;
						pingProcessing();
					} else {
						console.log('Bad video packet or something');
						pingProcessing(targetFrameTime - getTimestamp());
					}
				} else {
					// check in again soon!
					pingProcessing(targetFrameTime - getTimestamp());
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
			delay = 0;
		}
		if (nextProcessingTimer) {
			// already scheduled
			return;
		}
		//console.log('delaying for ' + delay);
		nextProcessingTimer = setTimeout(doProcessing, delay);
		//nextProcessingTimer = requestAnimationFrame(doProcessing);
	}

	var fps = 60;

	var videoInfo,
		audioInfo,
		imageData;

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

		codec = new OgvJs(options);
		codec.oninitvideo = function(info) {
			videoInfo = info;
			fps = info.fps;
			
			canvas.width = info.picWidth;
			canvas.height = info.picHeight;
			imageData = ctx.createImageData(info.frameWidth, info.frameHeight);

			// Prefill the alpha to opaque
			var data = imageData.data,
				pixelCount = info.frameWidth * info.frameHeight * 4;
			for (var i = 0; i < pixelCount; i += 4) {
				data[i + 3] = 255;
			}

			if (self.oninitvideo) {
				self.oninitvideo(info);
			}
		}
		codec.oninitaudio = function(info) {
			audioInfo = info;
			if (self.oninitaudio) {
				self.oninitaudio(info);
			}
			audioFeeder.init(info.channels, info.rate);
		}

		continueVideo = pingProcessing;

		audioFeeder = new AudioFeeder(2, 44100);
		if (muted) {
			audioFeeder.mute();
		}
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
	this.load = function() {
		if (stream) {
			// already loaded.
			return;
		}
		
		started = false;
		stream = new StreamFile({
			url: this.src,
			bufferSize: 256 * 1024,
			onstart: function() {
				// Fire off the read/decode/draw loop...
				started = true;
				if (onstart) {
					onstart();
				}
			},
			onread: function(data) {
				// Pass chunk into the codec's buffer
				codec.receiveInput(data);

				// Continue the read/decode/draw loop...
				pingProcessing();
			},
			ondone: function() {
				console.log("reading done.");
				stream = null;
				
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
	this.canPlayType = function(type) {
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
	this.play = function() {
		if (!stream) {
			this.load();
		}
		
		if (paused) {
			paused = false;
			if (continueVideo) {
				continueVideo();
			} else {
				playVideo();
			}
		}
	};
	
	/**
	 * custom onframecallback, takes frame decode time in ms
	 */
	this.onframecallback = null;
	
	/**
	 * custom getPlaybackStats method
	 */
	this.getPlaybackStats = function() {
		return {
			framesProcessed: framesProcessed,
			demuxingTime: demuxingTime,
			videoDecodingTime: videoDecodingTime,
			audioDecodingTime: audioDecodingTime,
			bufferTime: bufferTime,
			colorTime: colorTime,
			drawingTime: drawingTime,
			droppedAudio: droppedAudio,
			jitter: totalJitter / framesProcessed
		};
	};
	this.resetPlaybackStats = function() {
		framesProcessed = 0;
		demuxingTime = 0;
		videoDecodingTime = 0;
		audioDecodingTime = 0;
		bufferTime = 0;
		colorTime = 0;
		drawingTime = 0;
		totalJitter = 0;
	};
	
	/**
	 * HTMLMediaElement pause method
	 */
	this.pause = function() {
		if (!stream) {
			console.log('initializing stream');
			paused = true;
			this.load();
		} else if (!paused) {
			console.log('pausing');
			//cancelAnimationFrame(nextProcessingTimer);
			clearTimeout(nextProcessingTimer);
			nextProcessingTimer = null;
			paused = true;
		}
	};
	
	/**
	 * custom 'stop' method
	 */
	this.stop = function() {
		stopVideo();
	};

	/**
	 * HTMLMediaElement src property
	 */
	this.src = "";
	
	/**
	 */
	Object.defineProperty(this, "buffered", {
		get: function getBuffered() {
			var estimatedBufferTime;
			if (stream && this.byteLengthHint && this.durationHint) {
				estimatedBufferTime = (stream.bytesBuffered / this.byteLengthHint) * this.durationHint;
			} else {
				estimatedBufferTime = 0;
			}
			return new OgvJsTimeRanges([[0, estimatedBufferTime]]);
		}
	});
	
	/**
	 * HTMLMediaElement currentTime property
	 */
	Object.defineProperty(this, "currentTime", {
		get: function getCurrentTime() {
			if (codec && codec.hasAudio) {
				return audioFeeder.getPlaybackState().playbackPosition;
			} else if (codec && codec.hasVideo) {
				return framesPlayed * videoInfo.fps;
			} else {
				return 0;
			}
		}
	});
	
	/**
	 * custom durationHint property
	 */
	this.durationHint = null;
	
	/**
	 * custom byteLengthHint property
	 */
	this.byteLengthHint = null;
	
	/**
	 * HTMLMediaElement duration property
	 */
	Object.defineProperty(this, "duration", {
		get: function getDuration() {
			if (codec && (codec.hasAudio || codec.hasVideo)) {
				if (this.durationHint) {
					return this.durationHint;
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
	Object.defineProperty(this, "paused", {
		get: function getPaused() {
			return paused;
		}
	});
	
	/**
	 * HTMLMediaElement ended property
	 */
	Object.defineProperty(this, "ended", {
		get: function getEnded() {
			return ended;
		}
	});
	
	/**
	 * HTMLMediaElement muted property
	 */
	Object.defineProperty(this, "muted", {
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
	
	var poster;
	Object.defineProperty(this, "poster", {
		get: function getPoster() {
			return poster;
		},
		set: function setPoster(val) {
			poster = val;
			if (!started) {
				var thumbnail = new Image();
				thumbnail.src = poster;
				thumbnail.addEventListener('load', function() {
					if (!started) {
						ctx.drawImage(thumbnail, 0, 0, canvas.width, canvas.height);
					}
				});
			}
		}
	});
	return this;
}
