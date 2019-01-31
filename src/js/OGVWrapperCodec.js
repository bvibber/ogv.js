"use strict";

/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015-2019 Brion Vibber
 * @license MIT-style
 */
var OGVLoader = require("./OGVLoader.js");
var extend = require("./extend.js");

class  OGVWrapperCodec {
	constructor(options) {
		this.options = options || {};

		this.demuxer = null;
		this.videoDecoder = null;
		this.audioDecoder = null;
		this.flushIter = 0;

		this.loadedMetadata = false;
		this.processing = false;

		Object.defineProperties(this, {
			duration: {
				get: function() {
					if (this.loadedMetadata) {
						return this.demuxer.duration;
					} else {
						return NaN;
					}
				}
			},
			hasAudio: {
				get: function() {
					return this.loadedMetadata && !!this.audioDecoder;
				}
			},
			audioReady: {
				get: function() {
					return this.hasAudio && this.demuxer.audioReady;
				}
			},
			audioTimestamp: {
				get: function() {
					return this.demuxer.audioTimestamp;
				}
			},
			audioFormat: {
				get: function() {
					if (this.hasAudio) {
						return this.audioDecoder.audioFormat;
					} else {
						return null;
					}
				}
			},
			audioBuffer: {
				get: function() {
					if (this.hasAudio) {
						return this.audioDecoder.audioBuffer;
					} else {
						return null;
					}
				}
			},
			hasVideo: {
				get: function() {
					return this.loadedMetadata && !!this.videoDecoder;
				}
			},
			frameReady: {
				get: function() {
					return this.hasVideo && this.demuxer.frameReady;
				}
			},
			frameTimestamp: {
				get: function() {
					return this.demuxer.frameTimestamp;
				}
			},
			keyframeTimestamp: {
				get: function() {
					return this.demuxer.keyframeTimestamp;
				}
			},
			nextKeyframeTimestamp: {
				get: function() {
					return this.demuxer.nextKeyframeTimestamp;
				}
			},
			videoFormat: {
				get: function() {
					if (this.hasVideo) {
						return this.videoDecoder.videoFormat;
					} else {
						return null;
					}
				}
			},
			frameBuffer: {
				get: function() {
					if (this.hasVideo) {
						return this.videoDecoder.frameBuffer;
					} else {
						return null;
					}
				}
			},
			seekable: {
				get: function() {
					return this.demuxer.seekable;
				}
			},
			demuxerCpuTime: {
				get: function() {
					if (this.demuxer) {
						return this.demuxer.cpuTime;
					} else {
						return 0;
					}
				}
			},
			audioCpuTime: {
				get: function() {
					if (this.audioDecoder) {
						return this.audioDecoder.cpuTime;
					} else {
						return 0;
					}
				}
			},
			videoCpuTime: {
				get: function() {
					if (this.videoDecoder) {
						return this.videoDecoder.cpuTime;
					} else {
						return 0;
					}
				}
			}
		});

		this.loadedDemuxerMetadata = false;
		this.loadedAudioMetadata = false;
		this.loadedVideoMetadata = false;
		this.loadedAllMetadata = false;

		this.onseek = null;

		this.videoBytes = 0;
		this.audioBytes = 0;

		return this;
	}

	// Wrapper for callbacks to drop them after a flush
	flushSafe(func) {
		var savedFlushIter = this.flushIter;
		var self = this;
		return function(arg) {
			if (self.flushIter <= savedFlushIter) {
				func(arg);
			}
		};
	}

	// - public methods
	init(callback) {
		this.processing = true;
		var self = this;
		var demuxerClassName;
		if (this.options.type === 'video/webm' || this.options.type === 'audio/webm') {
			demuxerClassName = this.options.wasm ? 'OGVDemuxerWebMW' : 'OGVDemuxerWebM';
		} else {
			demuxerClassName = this.options.wasm ? 'OGVDemuxerOggW' : 'OGVDemuxerOgg';
		}
		OGVLoader.loadClass(demuxerClassName, function(demuxerClass) {
			demuxerClass().then(function(demuxer) {
				self.demuxer = demuxer;
				demuxer.onseek = function(offset) {
					if (self.onseek) {
						self.onseek(offset);
					}
				};
				demuxer.init(function() {
					self.processing = false;
					callback();
				});
			});
		});
	}

	close() {
		if (this.demuxer) {
			this.demuxer.close();
			this.demuxer = null;
		}
		if (this.videoDecoder) {
			this.videoDecoder.close();
			this.videoDecoder = null;
		}
		if (this.audioDecoder) {
			this.audioDecoder.close();
			this.audioDecoder = null;
		}
	}

	receiveInput(data, callback) {
		this.demuxer.receiveInput(data, callback);
	}

	process(callback) {
		if (this.processing) {
			throw new Error('reentrancy fail on OGVWrapperCodec.process');
		}
		this.processing = true;
		var self = this;

		function finish(result) {
			self.processing = false;
			callback(result);
		}

		function doProcessData() {
			self.demuxer.process(finish);
		}

		if (this.demuxer.loadedMetadata && !this.loadedDemuxerMetadata) {

			// Demuxer just reached its metadata. Load the relevant codecs!
			this.loadAudioCodec(function() {
				self.loadVideoCodec(function() {
					self.loadedDemuxerMetadata = true;
					self.loadedAudioMetadata = !self.audioDecoder;
					self.loadedVideoMetadata = !self.videoDecoder;
					self.loadedAllMetadata = self.loadedAudioMetadata && self.loadedVideoMetadata;
					finish(true);
				});
			});

		} else if (this.loadedDemuxerMetadata && !this.loadedAudioMetadata) {

			if (this.audioDecoder.loadedMetadata) {

				this.loadedAudioMetadata = true;
				this.loadedAllMetadata = this.loadedAudioMetadata && this.loadedVideoMetadata;
				finish(true);

			} else if (this.demuxer.audioReady) {

				this.demuxer.dequeueAudioPacket(function(packet) {
					self.audioBytes += packet.byteLength;
					self.audioDecoder.processHeader(packet, function(ret) {
						finish(true);
					});
				});

			} else {

				doProcessData();

			}

		} else if (this.loadedAudioMetadata && !this.loadedVideoMetadata) {

			if (this.videoDecoder.loadedMetadata) {

				this.loadedVideoMetadata = true;
				this.loadedAllMetadata = this.loadedAudioMetadata && this.loadedVideoMetadata;
				finish(true);

			} else if (this.demuxer.frameReady) {

				this.processing = true;
				this.demuxer.dequeueVideoPacket(function(packet) {
					self.videoBytes += packet.byteLength;
					self.videoDecoder.processHeader(packet, function() {
						finish(true);
					});
				});

			} else {

				doProcessData();

			}

		} else if (this.loadedVideoMetadata && !this.loadedMetadata && this.loadedAllMetadata) {

			// Ok we've found all the metadata there is. Enjoy.
			this.loadedMetadata = true;
			finish(true);

		} else if (this.loadedMetadata && (!this.hasAudio || this.demuxer.audioReady) && (!this.hasVideo || this.demuxer.frameReady)) {

			// Already queued up some packets. Go read them!
			finish(true);

		} else {

			// We need to process more of the data we've already received,
			// or ask for more if we ran out!
			doProcessData();

		}

	}

	decodeFrame(callback) {
		var cb = this.flushSafe(callback),
			timestamp = this.frameTimestamp,
			keyframeTimestamp = this.keyframeTimestamp;
		var self = this;
		this.demuxer.dequeueVideoPacket(function(packet) {
			self.videoBytes += packet.byteLength;
			self.videoDecoder.processFrame(packet, function(ok) {
				// hack
				var fb = self.videoDecoder.frameBuffer;
				if (fb) {
					fb.timestamp = timestamp;
					fb.keyframeTimestamp = keyframeTimestamp;
				}
				cb(ok);
			});
		});
	}

	decodeAudio(callback) {
		var cb = this.flushSafe(callback);
		var self = this;
		this.demuxer.dequeueAudioPacket(function(packet) {
			self.audioBytes += packet.byteLength;
			self.audioDecoder.processAudio(packet, cb);
		});
	}

	discardFrame(callback) {
		var self = this;
		this.demuxer.dequeueVideoPacket(function(packet) {
			self.videoBytes += packet.byteLength;
			callback();
		});
	}

	discardAudio(callback) {
		var self = this;
		this.demuxer.dequeueAudioPacket(function(packet) {
			self.audioBytes += packet.byteLength;
			callback();
		});
	}

	flush(callback) {
		this.flushIter++;
		this.demuxer.flush(callback);
	}

	getKeypointOffset(timeSeconds, callback) {
		this.demuxer.getKeypointOffset(timeSeconds, callback);
	}

	seekToKeypoint(timeSeconds, callback) {
		this.demuxer.seekToKeypoint(timeSeconds, this.flushSafe(callback));
	}
	
	loadAudioCodec(callback) {
		if (this.demuxer.audioCodec) {
			var wasm = !!this.options.wasm;
			var audioClassMap = {
				vorbis: wasm ? 'OGVDecoderAudioVorbisW' : 'OGVDecoderAudioVorbis',
				opus: wasm ? 'OGVDecoderAudioOpusW' : 'OGVDecoderAudioOpus'
			};
			var className = audioClassMap[this.demuxer.audioCodec];
			this.processing = true;
			var self = this;
			OGVLoader.loadClass(className, function(audioCodecClass) {
				var audioOptions = {};
				if (self.demuxer.audioFormat) {
					audioOptions.audioFormat = self.demuxer.audioFormat;
				}
				audioCodecClass(audioOptions).then(function(decoder) {
					self.audioDecoder = decoder;
					decoder.init(function() {
						self.loadedAudioMetadata = decoder.loadedMetadata;
						self.processing = false;
						callback();
					});
				});
			}, {
				worker: this.options.worker
			});
		} else {
			callback();
		}
	}

	loadVideoCodec(callback) {
		if (this.demuxer.videoCodec) {
			var wasm = !!this.options.wasm,
				threading = !!this.options.threading;
			var videoClassMap = {
				theora: wasm ? 'OGVDecoderVideoTheoraW' : 'OGVDecoderVideoTheora',
				vp8: wasm ? 'OGVDecoderVideoVP8W' : (threading ? 'OGVDecoderVideoVP8MT' : 'OGVDecoderVideoVP8'),
				vp9: wasm ? 'OGVDecoderVideoVP9W' : (threading ? 'OGVDecoderVideoVP9MT' : 'OGVDecoderVideoVP9'),
				av1: wasm ? 'OGVDecoderVideoAV1W' : 'OGVDecoderVideoAV1'
			};
			var className = videoClassMap[this.demuxer.videoCodec];
			this.processing = true;
			var self = this;
			OGVLoader.loadClass(className, function(videoCodecClass) {
				var videoOptions = {};
				if (self.demuxer.videoFormat) {
					videoOptions.videoFormat = self.demuxer.videoFormat;
				}
				if (self.options.memoryLimit) {
					videoOptions.memoryLimit = self.options.memoryLimit;
				}
				videoCodecClass(videoOptions).then(function(decoder) {
					self.videoDecoder = decoder;
					self.videoDecoder.init(function() {
						self.loadedVideoMetadata = self.videoDecoder.loadedMetadata;
						self.processing = false;
						callback();
					});
				});
			}, {
				worker: self.options.worker && !self.options.threading
			});
		} else {
			callback();
		}
	}
}

module.exports = OGVWrapperCodec;
