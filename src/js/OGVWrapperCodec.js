/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015
 * @license MIT-style
 */
var OGVLoader = require("./OGVLoader.js");

var OGVWrapperCodec = (function(options) {
	options = options || {};
	var self = this,
		suffix = '?version=' + encodeURIComponent(__OGV_FULL_VERSION__),
		base = (typeof options.base === 'string') ? (options.base + '/') : '',
		type = (typeof options.type === 'string') ? options.type : 'video/ogg',
		processing = false,
		demuxer = null,
		videoDecoder = null,
		audioDecoder = null,
		flushIter = 0;

	// Wrapper for callbacks to drop them after a flush
	function flushSafe(func) {
		var savedFlushIter = flushIter;
		return function(arg) {
			if (flushIter <= savedFlushIter) {
				func(arg);
			}
		};
	}

	var loadedMetadata = false;
	Object.defineProperty(self, 'loadedMetadata', {
		get: function() {
			return loadedMetadata;
		}
	});

	Object.defineProperty(self, 'processing', {
		get: function() {
			return processing/*
				|| (videoDecoder && videoDecoder.processing)
				|| (audioDecoder && audioDecoder.processing)*/;
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

	Object.defineProperty(self, 'nextKeyframeTimestamp', {
		get: function() {
			return demuxer.nextKeyframeTimestamp;
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

	Object.defineProperty(self, 'seekable', {
		get: function() {
			return demuxer.seekable;
		}
	});

	// - public methods
	self.init = function(callback) {
		var demuxerClassName;
		if (options.type === 'video/webm') {
			demuxerClassName = options.wasm ? 'OGVDemuxerWebMW' : 'OGVDemuxerWebM';
		} else {
			demuxerClassName = options.wasm ? 'OGVDemuxerOggW' : 'OGVDemuxerOgg';
		}
		processing = true;
		OGVLoader.loadClass(demuxerClassName, function(demuxerClass) {
			demuxerClass().then(function(demuxerModule) {
				demuxer = demuxerModule;
				demuxer.onseek = function(offset) {
					if (self.onseek) {
						self.onseek(offset);
					}
				};
				demuxer.init(function() {
					processing = false;
					callback();
				});
			});
		});
	};

	self.close = function() {
		if (demuxer) {
			demuxer.close();
			demuxer = null;
		}
		if (videoDecoder) {
			videoDecoder.close();
			videoDecoder = null;
		}
		if (audioDecoder) {
			audioDecoder.close();
			audioDecoder = null;
		}
	};

	self.receiveInput = function(data, callback) {
		demuxer.receiveInput(data, callback);
	};

	var audioClassMap = {
		vorbis: options.wasm ? 'OGVDecoderAudioVorbisW' : 'OGVDecoderAudioVorbis',
		opus: options.wasm ? 'OGVDecoderAudioOpusW' : 'OGVDecoderAudioOpus'
	};
	function loadAudioCodec(callback) {
		if (demuxer.audioCodec) {
			var className = audioClassMap[demuxer.audioCodec];
			processing = true;
			OGVLoader.loadClass(className, function(audioCodecClass) {
				var audioOptions = {};
				if (demuxer.audioFormat) {
					audioOptions.audioFormat = demuxer.audioFormat;
				}
				audioCodecClass(audioOptions).then(function(decoder) {
					audioDecoder = decoder;
					audioDecoder.init(function() {
						loadedAudioMetadata = audioDecoder.loadedMetadata;
						processing = false;
						callback();
					});
				});
			}, {
				worker: options.worker
			});
		} else {
			callback();
		}
	}

	var videoClassMap = {
		theora: options.wasm ? 'OGVDecoderVideoTheoraW' : 'OGVDecoderVideoTheora',
		vp8: options.wasm ? 'OGVDecoderVideoVP8W' : (options.threading ? 'OGVDecoderVideoVP8MT' : 'OGVDecoderVideoVP8'),
		vp9: options.wasm ? 'OGVDecoderVideoVP9W' : (options.threading ? 'OGVDecoderVideoVP9MT' : 'OGVDecoderVideoVP9')
	};
	function loadVideoCodec(callback) {
		if (demuxer.videoCodec) {
			var className = videoClassMap[demuxer.videoCodec];
			processing = true;
			OGVLoader.loadClass(className, function(videoCodecClass) {
				var videoOptions = {};
				if (demuxer.videoFormat) {
					videoOptions.videoFormat = demuxer.videoFormat;
				}
				if (options.memoryLimit) {
					videoOptions.memoryLimit = options.memoryLimit;
				}
				videoCodecClass(videoOptions).then(function(decoder) {
					videoDecoder = decoder;
					videoDecoder.init(function() {
						loadedVideoMetadata = videoDecoder.loadedMetadata;
						processing = false;
						callback();
					});
				});
			}, {
				worker: options.worker && !options.threading
			});
		} else {
			callback();
		}
	}

	var loadedDemuxerMetadata = false,
		loadedAudioMetadata = false,
		loadedVideoMetadata = false,
		loadedAllMetadata = false;

	self.process = function(callback) {
		if (processing) {
			throw new Error('reentrancy fail on OGVWrapperCodec.process');
		}
		processing = true;

		var videoPacketCount = demuxer.videoPackets.length,
			audioPacketCount = demuxer.audioPackets.length,
			start = (window.performance ? performance.now() : Date.now());
		function finish(result) {
			processing = false;
			var delta = (window.performance ? performance.now() : Date.now()) - start;
			if (delta > 8) {
				console.log('slow demux in ' + delta + ' ms; ' +
					(demuxer.videoPackets.length - videoPacketCount) + ' +video packets, ' +
					(demuxer.audioPackets.length - audioPacketCount) + ' +audio packets');
			}
			//console.log('demux returned ' + (result ? 'true' : 'false') + '; ' + demuxer.videoPackets.length + '; ' + demuxer.audioPackets.length);
			callback(result);
		}

		function doProcessData() {
			demuxer.process(finish);
		}

		if (demuxer.loadedMetadata && !loadedDemuxerMetadata) {

			// Demuxer just reached its metadata. Load the relevant codecs!
			loadAudioCodec(function() {
				loadVideoCodec(function() {
					loadedDemuxerMetadata = true;
					loadedAudioMetadata = !audioDecoder;
					loadedVideoMetadata = !videoDecoder;
					loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
					finish(true);
				});
			});

		} else if (loadedDemuxerMetadata && !loadedAudioMetadata) {

			if (audioDecoder.loadedMetadata) {

				loadedAudioMetadata = true;
				loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
				finish(true);

			} else if (demuxer.audioReady) {

				demuxer.dequeueAudioPacket(function(packet) {
					audioDecoder.processHeader(packet, function(ret) {
						finish(true);
					});
				});

			} else {

				doProcessData();

			}

		} else if (loadedAudioMetadata && !loadedVideoMetadata) {

			if (videoDecoder.loadedMetadata) {

				loadedVideoMetadata = true;
				loadedAllMetadata = loadedAudioMetadata && loadedVideoMetadata;
				finish(true);

			} else if (demuxer.frameReady) {

				processing = true;
				demuxer.dequeueVideoPacket(function(packet) {
					videoDecoder.processHeader(packet, function() {
						finish(true);
					});
				});

			} else {

				doProcessData();

			}

		} else if (loadedVideoMetadata && !self.loadedMetadata && loadedAllMetadata) {

			// Ok we've found all the metadata there is. Enjoy.
			loadedMetadata = true;
			finish(true);

		} else if (self.loadedMetadata && (!self.hasAudio || demuxer.audioReady) && (!self.hasVideo || demuxer.frameReady)) {

			// Already queued up some packets. Go read them!
			finish(true);

		} else {

			// We need to process more of the data we've already received,
			// or ask for more if we ran out!
			doProcessData();

		}

	};

	self.decodeFrame = function(callback) {
		var cb = flushSafe(callback),
			timestamp = self.frameTimestamp,
			keyframeTimestamp = self.keyframeTimestamp;
		demuxer.dequeueVideoPacket(function(packet) {
			videoDecoder.processFrame(packet, function(ok) {
				// hack
				if (videoDecoder.frameBuffer) {
					videoDecoder.frameBuffer.timestamp = timestamp;
					videoDecoder.frameBuffer.keyframeTimestamp = keyframeTimestamp;
				}
				cb(ok);
			});
		});
	};

	self.decodeAudio = function(callback) {
		var cb = flushSafe(callback);
		demuxer.dequeueAudioPacket(function(packet) {
			audioDecoder.processAudio(packet, cb);
		});
	}

	self.discardFrame = function(callback) {
		demuxer.dequeueVideoPacket(function(packet) {
			callback();
		});
	};

	self.discardAudio = function(callback) {
		demuxer.dequeueAudioPacket(function(packet) {
			callback();
		});
	};

	self.flush = function(callback) {
		flushIter++;
		demuxer.flush(callback);
	};

	self.getKeypointOffset = function(timeSeconds, callback) {
		demuxer.getKeypointOffset(timeSeconds, callback);
	};

	self.seekToKeypoint = function(timeSeconds, callback) {
		demuxer.seekToKeypoint(timeSeconds, flushSafe(callback));
	}

	self.onseek = null;

	Object.defineProperty(self, "demuxerCpuTime", {
		get: function() {
			if (demuxer) {
				return demuxer.cpuTime;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "audioCpuTime", {
		get: function() {
			if (audioDecoder) {
				return audioDecoder.cpuTime;
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "videoCpuTime", {
		get: function() {
			if (videoDecoder) {
				return videoDecoder.cpuTime;
			} else {
				return 0;
			}
		}
	});

	return self;
});

module.exports = OGVWrapperCodec;
