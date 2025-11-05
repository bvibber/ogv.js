/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brooke Vibber <bvibber@pobox.com>
 * @copyright 2015-2024 Brooke Vibber
 * @license MIT-style
 */
import OGVLoader from './OGVLoaderWeb.js';

const audioClassMap = {
	vorbis: 'OGVDecoderAudioVorbis',
	opus: 'OGVDecoderAudioOpus'
};

const videoClassMap = {
	theora: 'OGVDecoderVideoTheora',
	vp8: 'OGVDecoderVideoVP8',
	vp9: 'OGVDecoderVideoVP9',
	av1: 'OGVDecoderVideoAV1',
};

const videoThreadedClassMap = {
	vp9: 'OGVDecoderVideoVP9MT',
	av1: 'OGVDecoderVideoAV1MT',
};

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
			demuxerClassName = 'OGVDemuxerWebM';
		} else {
			demuxerClassName = 'OGVDemuxerOgg';
		}
		OGVLoader.loadClass(demuxerClassName, (demuxerClass) => {
			demuxerClass().then((demuxer) => {
				this.demuxer = demuxer;
				demuxer.onseek = (offset) => {
					if (this.onseek) {
						this.onseek(offset);
					}
				};
				demuxer.init();
				this.processing = false;
				callback();
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
		this.demuxer.receiveInput(data);
		callback();
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
			let result = this.demuxer.process();
			finish(result);
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

				let {data} = this.demuxer.dequeueAudioPacket();
				this.audioBytes += data.byteLength;
				this.audioDecoder.processHeader(data, (ret) => {
					finish(true);
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
				let {data} = this.demuxer.dequeueVideoPacket();
				this.videoBytes += data.byteLength;
				this.videoDecoder.processHeader(data, () => {
					finish(true);
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
		let {data} = this.demuxer.dequeueVideoPacket();
		this.videoBytes += data.byteLength;
		this.videoDecoder.processFrame(data, (ok) => {
			// hack
			let fb = this.videoDecoder.frameBuffer;
			if (fb) {
				fb.timestamp = timestamp;
				fb.keyframeTimestamp = keyframeTimestamp;
			}
			cb(ok);
		});
	}

	decodeAudio(callback) {
		let cb = this.flushSafe(callback);
		let {data, discardPadding} = this.demuxer.dequeueAudioPacket();
		this.audioBytes += data.byteLength;
		this.audioDecoder.processAudio(data, (ret) => {
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
	}

	discardFrame(callback) {
		let {data} = this.demuxer.dequeueVideoPacket();
		this.videoBytes += data.byteLength;
		callback();
	}

	discardAudio(callback) {
		let {data} = this.demuxer.dequeueAudioPacket();
		this.audioBytes += data.byteLength;
		callback();
	}

	flush(callback) {
		this.flushIter++;
		this.demuxer.flush();
		callback();
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
		let ret = this.demuxer.getKeypointOffset(timeSeconds);
		callback(ret);
	}

	seekToKeypoint(timeSeconds, callback) {
		callback = this.flushSafe(callback);
		let ret = this.demuxer.seekToKeypoint(timeSeconds);
		callback(ret);
	}
	
	loadAudioCodec(callback) {
		let codec = this.demuxer.audioCodec;
		if (codec) {
			let className = audioClassMap[codec];
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
		const codec = this.demuxer.videoCodec;
		if (codec) {
			let threading = !!this.options.threading;
			let className = videoClassMap[codec];
			if (threading && videoThreadedClassMap[codec]) {
				className = videoThreadedClassMap[codec];
			}
			this.processing = true;
			OGVLoader.loadClass(className, (videoCodecClass) => {
				let videoOptions = {};
				if (this.demuxer.videoFormat) {
					videoOptions.videoFormat = this.demuxer.videoFormat;
				}
				videoCodecClass(videoOptions).then((decoder) => {
					this.videoDecoder = decoder;
					decoder.init(() => {
						this.loadedVideoMetadata = decoder.loadedMetadata;
						this.processing = false;
						callback();
					});
				});
			}, {
				worker: this.options.worker && !this.options.threading
			});
		} else {
			callback();
		}
	}
}

export default OGVWrapperCodec;
