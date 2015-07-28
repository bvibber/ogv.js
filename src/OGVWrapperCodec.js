/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015
 * @license MIT-style
 */
OGVWrapperCodec = (function(options) {
	options = options || {};
	var self = this,
		suffix = '?version=' + encodeURIComponent(OGVVersion),
		base = (typeof options.base === 'string') ? (options.base + '/') : '',
		type = (typeof options.type === 'string') ? options.type : 'video/ogg',
		processing = false,
		demuxer = null,
		videoDecoder = null,
		audioDecoder = null;

	var loadedMetadata = false;
	Object.defineProperty(self, 'loadedMetadata', {
		get: function() {
			return loadedMetadata;
		}
	});

	Object.defineProperty(self, 'processing', {
		get: function() {
			return processing
				|| (videoDecoder && videoDecoder.processing)
				|| (audioDecoder && audioDecoder.processing);
		}
	});

	Object.defineProperty(self, 'duration', {
		get: function() {
			if (self.loadedMetadata) {
				return demuxer.duration;
			} else {
				return NaN;
			}
		}
	});

	Object.defineProperty(self, 'hasAudio', {
		get: function() {
			return self.loadedMetadata && !!audioDecoder;
		}
	});

	Object.defineProperty(self, 'audioReady', {
		get: function() {
			return self.hasAudio && demuxer.audioReady;
		}
	});

	Object.defineProperty(self, 'audioTimestamp', {
		get: function() {
			return demuxer.audioTimestamp;
		}
	});

	Object.defineProperty(self, 'audioFormat', {
		get: function() {
			if (self.hasAudio) {
				return audioDecoder.audioFormat;
			} else {
				return null;
			}
		}
	});

	Object.defineProperty(self, 'audioBuffer', {
		get: function() {
			if (self.hasAudio) {
				return audioDecoder.audioBuffer;
			} else {
				return null;
			}
		}
	});

	Object.defineProperty(self, 'hasVideo', {
		get: function() {
			return self.loadedMetadata && !!videoDecoder;
		}
	});

	Object.defineProperty(self, 'frameReady', {
		get: function() {
			return self.hasVideo && demuxer.frameReady;
		}
	});

	Object.defineProperty(self, 'frameTimestamp', {
		get: function() {
			return demuxer.frameTimestamp;
		}
	});

	Object.defineProperty(self, 'keyframeTimestamp', {
		get: function() {
			return demuxer.keyframeTimestamp;
		}
	});

	Object.defineProperty(self, 'videoFormat', {
		get: function() {
			if (self.hasVideo) {
				return videoDecoder.videoFormat;
			} else {
				return null;
			}
		}
	});

	Object.defineProperty(self, 'frameBuffer', {
		get: function() {
			if (self.hasVideo) {
				return videoDecoder.frameBuffer;
			} else {
				return null;
			}
		}
	});

	// - public methods
	self.init = function(callback) {
		var demuxerClassName;
		if (options.type === 'video/webm') {
			throw new Exception('webm modules not yet built');
		} else {
			demuxerClassName = 'OGVDemuxerOgg';
		}
		OGVLoader.loadClass(demuxerClassName, function(demuxerClass) {
			demuxer = new demuxerClass();
			demuxer.init(callback);
		});
	};

	self.destroy = function() {
		demuxer = null;
		videoDecoder = null;
		audioDecoder = null;
	};

	var inputQueue = [];
	self.receiveInput = function(data, callback) {
		inputQueue.push(data);
		callback();
	};

	var audioClassMap = {
		vorbis: 'OGVDecoderAudioVorbis',
		opus: 'OGVDecoderAudioOpus'
	};
	function loadAudioCodec(callback) {
		if (demuxer.audioCodec) {
			var className = audioClassMap[demuxer.audioCodec];
			processing = true;
			OGVLoader.loadClass(className, function(audioCodecClass) {
				audioDecoder = new audioCodecClass();
				processing = false;
				callback();
			}, {
				worker: options.worker
			});
		} else {
			callback();
		}
	}

	var videoClassMap = {
		theora: 'OGVDecoderVideoTheora',
		vp8: 'OGVDecoderVideoVP8',
		vp9: 'OGVDecoderVideoVP9'
	};
	function loadVideoCodec(callback) {
		if (demuxer.videoCodec) {
			var className = videoClassMap[demuxer.videoCodec];
			processing = true;
			OGVLoader.loadClass(className, function(videoCodecClass) {
				videoDecoder = new videoCodecClass();
				processing = false;
				callback();
			}, {
				worker: options.worker
			});
		} else {
			callback();
		}
	}

	var loadedDemuxerMetadata = false,
		loadedAudioMetadata = false,
		loadedVideoMetadata = false;

	self.process = function(callback) {
		if (processing) {
			throw new Error('reentrancy fail on OGVWrapperCodec.process');
		}

		//console.log('process check...', self.hasAudio, demuxer.audioReady, demuxer.audioTimestamp, self.hasVideo, demuxer.frameReady, demuxer.frameTimestamp);

		if (demuxer.loadedMetadata && !loadedDemuxerMetadata) {

			// Demuxer just reached its metadata. Load the relevant codecs!
			console.log('processing: loading codecs');
			loadAudioCodec(function() {
				loadVideoCodec(function() {
					loadedDemuxerMetadata = true;
					loadedAudioMetadata = !audioDecoder;
					loadedVideoMetadata = !videoDecoder;
					loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
					callback(true);
				});
			});

		} else if (loadedDemuxerMetadata && !loadedAudioMetadata) {

			if (audioDecoder.loadedMetadata) {

				console.log('processing: loaded audio metadata');
				loadedAudioMetadata = true;
				loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
				callback(true);

			} else if (demuxer.audioReady) {

				console.log('processing: found audio header');
				demuxer.dequeueAudioPacket(function(packet) {
					audioDecoder.processHeader(packet, function(ret) {
						console.log('audioDecoder.processHeader', ret);
						callback(true);
					});
				});

			} else {

				console.log('processing: need more audio headers');
				callback(true);

			}

		} else if (loadedAudioMetadata && !loadedVideoMetadata) {

			if (videoDecoder.loadedMetadata) {

				console.log('processing: loaded video metadata');
				loadedVideoMetadata = true;
				loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
				callback(true);

			} else if (demuxer.frameReady) {

				console.log('processing: found video header');
				demuxer.dequeueVideoPacket(function(packet) {
					videoDecoder.processHeader(packet, function() {
						callback(true);
					});
				});

			} else {

				console.log('processing: need more video headers');
				callback(true);

			}

		} else if (loadedVideoMetadata && !self.loadedMetadata && loadedAllMetadata) {

			// Ok we've found all the metadata there is. Enjoy.
			console.log('processing: found all metadata');
			loadedMetadata = true;
			callback(true);

		} else if (self.loadedMetadata && (!self.hasAudio || demuxer.audioReady) && (!self.hasVideo || demuxer.frameReady)) {

			// Already queued up some packets. Go read them!
			callback(true);

		} else if (inputQueue.length == 0) {

			// out of data! ask for more
			callback(false);

		} else {

			// We need to process more of the data we've already received...
			var data = inputQueue.shift();
			demuxer.process(data, function(more) {
				callback(more);
			});

		}

	};

	self.decodeFrame = function(callback) {
		var timestamp = self.frameTimestamp,
			keyframeTimestamp = self.keyframeTimestamp;
		demuxer.dequeueVideoPacket(function(packet) {
			videoDecoder.processFrame(packet, function(ok) {
				// hack
				if (self.frameBuffer) {
					self.frameBuffer.timestamp = timestamp;
					self.frameBuffer.keyframeTimestamp = keyframeTimestamp;
				}
				callback(ok);
			});
		});
	};

	self.decodeAudio = function(callback) {
		demuxer.dequeueAudioPacket(function(packet) {
			audioDecoder.processAudio(packet, function(ok) {
				callback(ok);
			});
		});
	}

	self.discardFrame = function(callback) {
		demuxer.dequeueVideoPacket(function(packet) {
			callback();
		});
	};

	self.discardAudio = function(callback) {
		demuxer.dequeueAudioPacket(function(packet) {
			callback(ok);
		});
	};

	self.flush = function(callback) {
		demuxer.flush(callback);
	};

	self.getKeypointOffset = function(timeSeconds, callback) {
		demuxer.getKeypointOffset(timeSeconds, callback);
	};

	return self;
});
