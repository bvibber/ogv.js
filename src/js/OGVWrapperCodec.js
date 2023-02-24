/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015-2019 Brion Vibber
 * @license MIT-style
 */
import OGVLoader from './OGVLoaderWeb.js';
import {OGVDecoderVideoWebCodecs} from './OGVWebCodecs.js';

class OGVWrapperCodec {
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
		let savedFlushIter = this.flushIter;
		return (arg) => {
			if (this.flushIter <= savedFlushIter) {
				func(arg);
			}
		};
	}

	// - public methods
	init(callback) {
		this.processing = true;
		let demuxerClassName;
		if (this.options.type === 'video/webm' || this.options.type === 'audio/webm') {
			demuxerClassName = 'OGVDemuxerWebMW';
		} else {
			demuxerClassName = 'OGVDemuxerOggW';
		}
		OGVLoader.loadClass(demuxerClassName, (demuxerClass) => {
			demuxerClass().then((demuxer) => {
				this.demuxer = demuxer;
				demuxer.onseek = (offset) => {
					if (this.onseek) {
						this.onseek(offset);
					}
				};
				demuxer.init(() => {
					this.processing = false;
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

		let finish = (result) => {
			this.processing = false;
			callback(result);
		}

		let doProcessData = () => {
			this.demuxer.process(finish);
		}

		if (this.demuxer.loadedMetadata && !this.loadedDemuxerMetadata) {

			// Demuxer just reached its metadata. Load the relevant codecs!
			this.loadAudioCodec(() => {
				this.loadVideoCodec(() => {
					this.loadedDemuxerMetadata = true;
					this.loadedAudioMetadata = !this.audioDecoder;
					this.loadedVideoMetadata = !this.videoDecoder;
					this.loadedAllMetadata = this.loadedAudioMetadata && this.loadedVideoMetadata;
					finish(true);
				});
			});

		} else if (this.loadedDemuxerMetadata && !this.loadedAudioMetadata) {

			if (this.audioDecoder.loadedMetadata) {

				this.loadedAudioMetadata = true;
				this.loadedAllMetadata = this.loadedAudioMetadata && this.loadedVideoMetadata;
				finish(true);

			} else if (this.demuxer.audioReady) {

				this.demuxer.dequeueAudioPacket((packet, _discardPadding) => {
					this.audioBytes += packet.byteLength;
					this.audioDecoder.processHeader(packet, (ret) => {
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
				this.demuxer.dequeueVideoPacket((packet) => {
					this.videoBytes += packet.byteLength;
					this.videoDecoder.processHeader(packet, () => {
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
		let cb = this.flushSafe(callback),
			timestamp = this.frameTimestamp,
			keyframeTimestamp = this.keyframeTimestamp;
		this.demuxer.dequeueVideoPacket((packet) => {
			this.videoBytes += packet.byteLength;
			this.videoDecoder.processFrame(packet, (ok) => {
				// hack
				let fb = this.videoDecoder.frameBuffer;
				if (fb) {
					fb.timestamp = timestamp;
					fb.keyframeTimestamp = keyframeTimestamp;
				}
				cb(ok);
			}, {
				timestamp: timestamp * 1000000,
				duration: 20 * 1000, // hack
				type: keyframeTimestamp === timestamp ? 'key' : 'delta'
			});
		});
	}

	decodeAudio(callback) {
		let cb = this.flushSafe(callback);
		this.demuxer.dequeueAudioPacket((packet, discardPadding) => {
			this.audioBytes += packet.byteLength;
			this.audioDecoder.processAudio(packet, (ret) => {
				if (discardPadding) {
					// discardPadding is in nanoseconds
					// negative value trims from beginning
					// positive value trims from end
					let samples = this.audioDecoder.audioBuffer;
					let trimmed = [];
					for (let channel of samples) {
						let trim = Math.round(discardPadding * this.audioFormat.rate / 1000000000);
						if (trim > 0) {
							trimmed.push(channel.subarray(0, channel.length - Math.min(trim, channel.length)));
						} else {
							trimmed.push(channel.subarray(Math.min(Math.abs(trim), channel.length), channel.length));
						}
					}
					// kinda hacky for now
					this.audioDecoder.audioBuffer = trimmed;
				}
				return cb(ret);
			});
		});
	}

	discardFrame(callback) {
		this.demuxer.dequeueVideoPacket((packet) => {
			this.videoBytes += packet.byteLength;
			callback();
		});
	}

	discardAudio(callback) {
		this.demuxer.dequeueAudioPacket((packet, _discardPadding) => {
			this.audioBytes += packet.byteLength;
			callback();
		});
	}

	flush(callback) {
		this.flushIter++;
		this.demuxer.flush(callback);
	}

	sync() {
		if (this.videoDecoder) {
			this.videoDecoder.sync();
		}
	}

	recycleFrame(frame) {
		if (this.videoDecoder) {
			this.videoDecoder.recycleFrame(frame);
		}
	}

	getKeypointOffset(timeSeconds, callback) {
		this.demuxer.getKeypointOffset(timeSeconds, callback);
	}

	seekToKeypoint(timeSeconds, callback) {
		this.demuxer.seekToKeypoint(timeSeconds, this.flushSafe(callback));
	}
	
	loadAudioCodec(callback) {
		if (this.demuxer.audioCodec) {
			let audioClassMap = {
				vorbis: 'OGVDecoderAudioVorbisW',
				opus: 'OGVDecoderAudioOpusW'
			};
			let className = audioClassMap[this.demuxer.audioCodec];
			this.processing = true;
			OGVLoader.loadClass(className, (audioCodecClass) => {
				let audioOptions = {};
				if (this.demuxer.audioFormat) {
					audioOptions.audioFormat = this.demuxer.audioFormat;
				}
				audioCodecClass(audioOptions).then((decoder) => {
					this.audioDecoder = decoder;
					decoder.init(() => {
						this.loadedAudioMetadata = decoder.loadedMetadata;
						this.processing = false;
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
			let codec = this.demuxer.videoCodec;
			let format = this.demuxer.videoFormat;

			let webcodecs = this.options.webcodecs
				? OGVDecoderVideoWebCodecs.isCodecSupported(codec)
				: Promise.resolve(false);
			webcodecs.then((supported) => {
				if (supported) {
					return OGVDecoderVideoWebCodecs.factory(codec);
				}
				let simd = !!this.options.simd,
				threading = !!this.options.threading;
				let videoClassMap = {
					theora: 'OGVDecoderVideoTheoraW',
					vp8: (threading ? 'OGVDecoderVideoVP8MTW' : 'OGVDecoderVideoVP8W'),
					vp9: (threading ? (simd ? 'OGVDecoderVideoVP9SIMDMTW'
										: 'OGVDecoderVideoVP9MTW')
									: (simd ? 'OGVDecoderVideoVP9SIMDW'
										: 'OGVDecoderVideoVP9W')),
					av1: (threading ? (simd ? 'OGVDecoderVideoAV1SIMDMTW'
											: 'OGVDecoderVideoAV1MTW')
									: (simd ? 'OGVDecoderVideoAV1SIMDW'
											: 'OGVDecoderVideoAV1W')),
				};
				let className = videoClassMap[codec];
				this.processing = true;
				return new Promise((resolve, reject) => {
					OGVLoader.loadClass(className, resolve, {
						worker: this.options.worker && !this.options.threading
					});
				});
			}).then((videoCodecClass) => {
				let videoOptions = {};
				if (format) {
					videoOptions.videoFormat = format;
				}
				videoCodecClass(videoOptions).then((decoder) => {
					this.videoDecoder = decoder;
					decoder.init(() => {
						this.loadedVideoMetadata = decoder.loadedMetadata;
						this.processing = false;
						callback();
					});
				});
			});
		} else {
			callback();
		}
	}
}

export default OGVWrapperCodec;
