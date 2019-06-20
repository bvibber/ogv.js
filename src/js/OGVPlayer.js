// OGVPlayer.js

// External deps
import YUVCanvas from 'yuv-canvas';
import StreamFile from 'stream-file';
import AudioFeeder from 'audio-feeder';
import dynamicaudio_swf from 'audio-feeder/dist/dynamicaudio.swf';

// Internal deps
import OGVLoader from './OGVLoaderWeb.js';
import Bisector from './Bisector.js';
import extend from './extend.js';
import OGVMediaError from './OGVMediaError.js';
import OGVMediaType from './OGVMediaType.js';
import OGVTimeRanges from './OGVTimeRanges.js';
import OGVWrapperCodec from './OGVWrapperCodec.js';

const constants = {
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

const State = {
	INITIAL: 'INITIAL',
	SEEKING_END: 'SEEKING_END',
	LOADED: 'LOADED',
	PRELOAD: 'PRELOAD',
	READY: 'READY',
	PLAYING: 'PLAYING',
	SEEKING: 'SEEKING',
	ENDED: 'ENDED',
	ERROR: 'ERROR'
};

const SeekState = {
	NOT_SEEKING: 'NOT_SEEKING',
	BISECT_TO_TARGET: 'BISECT_TO_TARGET',
	BISECT_TO_KEYPOINT: 'BISECT_TO_KEYPOINT',
	LINEAR_TO_TARGET: 'LINEAR_TO_TARGET'
};

const SeekMode = {
	EXACT: "exact",
	FAST: "fast"
};

let getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === undefined) {
	getTimestamp = Date.now;
} else {
	getTimestamp = performance.now.bind(performance);
}

function OGVJSElement() {
	// Stub constructor so we can extend this and
	// still have it work in IE11 without a big
	// polyfill.
	// IE 11 or pre-custom-elements browser
	// Note we're not ready to use custom elements without an API break,
	// as we require an options param for some setup that isn't possible
	let el = document.createElement('ogvjs');
	if (Object.setPrototypeOf) {
		// Modernish browser
		Object.setPrototypeOf(el, Object.getPrototypeOf(this));
	} else {
		// IE icky!
		el.__proto__ = this.__proto__;
	}
	return el;
}
OGVJSElement.prototype = Object.create(HTMLElement.prototype, {});

/**
 * Player class -- instantiate one of these to get an 'ogvjs' HTML element
 * which has a similar interface to the HTML audio/video elements.
 *
 * @param options: optional dictionary of options:
 *                 'base': string; base URL for additional resources, such as Flash audio shim
 *                 'webGL': bool; pass true to use WebGL acceleration if available
 *                 'forceWebGL': bool; pass true to require WebGL even if not detected
 */
class OGVPlayer extends OGVJSElement {
	constructor(options) {
		super();

		options = options || {};
		options.base = options.base || OGVLoader.base;
		this._options = options;

		this._instanceId = 'ogvjs' + (++OGVPlayer.instanceCount);

		// Running the codec in a worker thread equals happy times!
		if (typeof options.worker !== 'undefined') {
			this._enableWorker = !!options.worker;
		} else {
			this._enableWorker = !!window.Worker;
		}

		// Use the WebAssembly build by default if available;
		// it should load and compile faster than asm.js.
		if (typeof options.wasm !== 'undefined') {
			this._enableWASM = !!options.wasm;
		} else {
			this._enableWASM = OGVLoader.wasmSupported();
		}

		// Experimental pthreads multithreading mode, if built.
		this._enableThreading = !!options.threading;

		this._state = State.INITIAL;
		this._seekState = SeekState.NOT_SEEKING;

		this._detectedType = null;

		this._canvas = document.createElement('canvas');
		this._frameSink = null;

		if (options.video && this._canvas.captureStream) {
			this._mediaStream = new MediaStream();
			this._video = (typeof options.video === 'object') ? options.video : document.createElement('video');
			this._video.srcObject = this._mediaStream;
		} else {
			this._video = null;
		}
		this._videoTrack = null;
		this._audioTrack = null;
		this._canvasStream = null;

		this.className = this._instanceId;

		extend(this, constants);

		this._view = this._video || this._canvas;
		this._view.style.position = 'absolute';
		this._view.style.top = '0';
		this._view.style.left = '0';
		this._view.style.width = '100%';
		this._view.style.height = '100%';
		this._view.style.objectFit = 'contain';
		this.appendChild(this._view);

		// Used for relative timestamp in _log()
		this._startTime = getTimestamp();

		this._codec = null;
		this._audioInfo = null;
		this._videoInfo = null;
		this._actionQueue = [];
		this._audioFeeder = null;
		this._muted = false;
		this._initialPlaybackPosition = 0.0;
		this._initialPlaybackOffset = 0.0;
		this._prebufferingAudio = false;
		this._initialSeekTime = 0.0;


		this._currentSrc = '';
		this._streamEnded = false;
		this._mediaError = null;
		this._dataEnded = false;
		this._byteLength = 0;
		this._duration = null;
		this._lastSeenTimestamp = null;
		this._nextProcessingTimer;
		this._nextFrameTimer = null;
		this._loading = false;
		this._started = false;
		this._paused = true;
		this._ended = false;
		this._startedPlaybackInDocument = false;

		this._stream = undefined;

		// Benchmark data, exposed via getPlaybackStats()
		this._framesProcessed = 0; // frames
		this._targetPerFrameTime = 1000 / 60; // ms
		this._actualPerFrameTime = 0; // ms
		this._totalFrameTime = 0; // ms
		this._totalFrameCount = 0; // frames
		this._playTime = 0; // ms
		this._bufferTime = 0; // ms
		this._drawingTime = 0; // ms
		this._proxyTime = 0; // ms
		this._totalJitter = 0; // sum of ms we're off from expected frame delivery time
		// Benchmark data that doesn't clear
		this._droppedAudio = 0; // number of times we were starved for audio
		this._delayedAudio = 0; // seconds audio processing was delayed by blocked CPU
		this._lateFrames = 0;   // number of times a frame was late and we had to halt audio
		this._poster = '';
		this._thumbnail = null;

		this._frameEndTimestamp = 0.0;
		this._audioEndTimestamp = 0.0;
		this._decodedFrames = [];
		this._pendingFrames = [];
		this._lastFrameDecodeTime = 0.0;
		this._lastFrameVideoCpuTime = 0;
		this._lastFrameAudioCpuTime = 0;
		this._lastFrameDemuxerCpuTime = 0;
		this._lastFrameDrawingTime = 0;
		this._lastFrameBufferTime = 0;
		this._lastFrameProxyTime = 0;
		this._lastVideoCpuTime = 0;
		this._lastAudioCpuTime = 0;
		this._lastDemuxerCpuTime = 0;
		this._lastBufferTime = 0;
		this._lastProxyTime = 0;
		this._lastDrawingTime = 0;
		this._lastFrameTimestamp = 0.0;
		this._currentVideoCpuTime = 0.0;

		this._lastTimeUpdate = 0; // ms
		this._timeUpdateInterval = 250; // ms

		// -- seek functions
		this._seekTargetTime = 0.0;
		this._bisectTargetTime = 0.0;
		this._seekMode = null;
		this._lastSeekPosition = null;
		this._seekBisector = null;
		this._didSeek = null;

		this._depth = 0;
		this._needProcessing = false;
		this._pendingFrame = 0;
		this._pendingAudio = 0;
		this._framePipelineDepth = 8;
		this._frameParallelism = this._enableThreading ? (Math.min(8, navigator.hardwareConcurrency) || 1) : 0;
		this._audioPipelineDepth = 12;

		this._videoInfo = null;
		this._audioInfo = null;

		// Display size...
		this._width = 0;
		this._height = 0;
		this._volume = 1;
		this._playbackRate = 1;

		Object.defineProperties(this, {
			/**
			 * HTMLMediaElement src property
			 */
			src: {
				get: function getSrc() {
					return this.getAttribute('src') || '';
				},
				set: function setSrc(val) {
					this.setAttribute('src', val);
					this._loading = false; // just in case?
					this._prepForLoad("interactive");
				}
			},

			/**
			 * HTMLMediaElement buffered property
			 */
			buffered: {
				get: function getBuffered() {
					let ranges;
					if (this._stream && this._byteLength && this._duration) {
						ranges = this._stream.getBufferedRanges().map((range) => {
							return range.map((offset) => {
								return (offset / this._stream.length) * this._duration;
							});
						});
					} else {
						ranges = [[0, 0]];
					}
					return new OGVTimeRanges(ranges);
				}
			},

			/**
			 * HTMLMediaElement seekable property
			 */
			seekable: {
				get: function getSeekable() {
					if (this.duration < Infinity && this._stream && this._stream.seekable && this._codec && this._codec.seekable) {
						return new OGVTimeRanges([[0, this._duration]]);
					} else {
						return new OGVTimeRanges([]);
					}
				}
			},

			/**
			 * HTMLMediaElement currentTime property
			 */
			currentTime: {
				get: function getCurrentTime() {
					if (this._state == State.SEEKING) {
						return this._seekTargetTime;
					} else {
						if (this._codec) {
							if (this._state == State.PLAYING && !this._paused) {
								return this._getPlaybackTime();
							} else {
								return this._initialPlaybackOffset;
							}
						} else {
							return this._initialSeekTime;
						}
					}
				},
				set: function setCurrentTime(val) {
					this._seek(val, SeekMode.EXACT);
				}
			},

			/**
			 * HTMLMediaElement duration property
			 */
			duration: {
				get: function getDuration() {
					if (this._codec && this._codec.loadedMetadata) {
						if (this._duration !== null) {
							return this._duration;
						} else {
							return Infinity;
						}
					} else {
						return NaN;
					}
				}
			},

			/**
			 * HTMLMediaElement paused property
			 */
			paused: {
				get: function getPaused() {
					return this._paused;
				}
			},

			/**
			 * HTMLMediaElement ended property
			 */
			ended: {
				get: function getEnded() {
					return this._ended;
				}
			},

			/**
			 * HTMLMediaElement ended property
			 */
			seeking: {
				get: function getSeeking() {
					return (this._state == State.SEEKING);
				}
			},

			/**
			 * HTMLMediaElement muted property
			 */
			muted: {
				get: function getMuted() {
					return this._muted;
				},
				set: function setMuted(val) {
					this._muted = val;
					if (this._audioFeeder) {
						this._audioFeeder.muted = this._muted;
					} else if (this._started && !this._muted && this._codec && this._codec.hasAudio) {
						this._log('unmuting: switching from timer to audio clock');
						this._initAudioFeeder();
						this._startPlayback(this._audioEndTimestamp);
					}
					this._fireEventAsync('volumechange');
				}
			},

			/**
			 * HTMLMediaElement poster property
			 */
			poster: {
				get: function getPoster() {
					return this._poster;
				},
				set: function setPoster(val) {
					this._poster = val;
					if (!this._started) {
						if (this._thumbnail) {
							this.removeChild(this._thumbnail);
						}
						let thumbnail = new Image();
						thumbnail.src = this._poster;
						thumbnail.className = 'ogvjs-poster';
						thumbnail.style.position = 'absolute';
						thumbnail.style.top = '0';
						thumbnail.style.left = '0';
						thumbnail.style.width = '100%';
						thumbnail.style.height = '100%';
						thumbnail.style.objectFit = 'contain';
						thumbnail.style.visibility = 'hidden';
						thumbnail.addEventListener('load', () => {
							if (this._thumbnail === thumbnail) {
								OGVPlayer.styleManager.appendRule('.' + this._instanceId, {
									width: thumbnail.naturalWidth + 'px',
									height: thumbnail.naturalHeight + 'px'
								});
								OGVPlayer.updatePositionOnResize();
								thumbnail.style.visibility = 'visible';
							}
						});
						this._thumbnail = thumbnail;
						this.appendChild(thumbnail);
					}
				}
			},

			/**
			 * HTMLMediaElement video width property
			 */
			videoWidth: {
				get: function getVideoWidth() {
					if (this._videoInfo) {
						return this._videoInfo.displayWidth;
					} else {
						return 0;
					}
				}
			},

			/**
			 * HTMLMediaElement video height property
			 */
			videoHeight: {
				get: function getVideoHeight() {
					if (this._videoInfo) {
						return this._videoInfo.displayHeight;
					} else {
						return 0;
					}
				}
			},

			/**
			 * Custom video framerate property
			 */
			ogvjsVideoFrameRate: {
				get: function getOgvJsVideoFrameRate() {
					if (this._videoInfo) {
						if (this._videoInfo.fps == 0) {
							return this._totalFrameCount / (this._totalFrameTime / 1000);
						} else {
							return this._videoInfo.fps;
						}
					} else {
						return 0;
					}
				}
			},

			/**
			 * Custom audio metadata property
			 */
			ogvjsAudioChannels: {
				get: function getOgvJsAudioChannels() {
					if (this._audioInfo) {
						return this._audioInfo.channels;
					} else {
						return 0;
					}
				}
			},

			/**
			 * Custom audio metadata property
			 */
			ogvjsAudioSampleRate: {
				get: function getOgvJsAudioChannels() {
					if (this._audioInfo) {
						return this._audioInfo.rate;
					} else {
						return 0;
					}
				}
			},

			/**
			 * @property width
			 * @todo reflect to the width attribute?
			 */
			width: {
				get: function getWidth() {
					return this._width;
				},
				set: function setWidth(val) {
					this._width = parseInt(val, 10);
					this.style.width = this._width + 'px';
					OGVPlayer.updatePositionOnResize();
				}
			},

			/**
			 * @property height
			 * @todo reflect to the height attribute?
			 */
			height: {
				get: function getHeight() {
					return this._height;
				},
				set: function setHeight(val) {
					this._height = parseInt(val, 10);
					this.style.height = this._height + 'px';
					OGVPlayer.updatePositionOnResize();
				}
			},

			/**
			 * @property autoplay {boolean} stub prop
			 * @todo reflect to the autoplay attribute?
			 * @todo implement actual autoplay behavior
			 */
			autoplay: {
				get: function getAutoplay() {
					return false;
				},
				set: function setAutoplay(val) {
					// ignore
				}
			},

			/**
			 * @property controls {boolean} stub prop
			 * @todo reflect to the controls attribute?
			 * @todo implement actual control behavior
			 */
			controls: {
				get: function getControls() {
					return false;
				},
				set: function setControls(val) {
					// ignore
				}
			},

			/**
			 * @property loop {boolean} stub prop
			 * @todo reflect to the controls attribute?
			 * @todo implement actual loop behavior
			 */
			loop: {
				get: function getLoop() {
					return false;
				},
				set: function setLoop(val) {
					// ignore
				}
			},

			/**
			 * @property crossOrigin {string|null} stub prop
			 * @todo reflect to the crossorigin attribute?
			 * @todo implement actual behavior
			 */
			crossOrigin: {
				get: function getCrossOrigin() {
					return null;
				},
				set: function setCrossOrigin(val) {
					// ignore
				}
			},

			/**
			 * Returns the URL to the currently-playing resource.
			 * @property currentSrc {string|null}
			 */
			currentSrc: {
				get: function getCurrentSrc() {
					// @todo return absolute URL per spec
					return this._currentSrc;
				}
			},

			defaultMuted: {
				get: function getDefaultMuted() {
					return false;
				}
			},

			defaultPlaybackRate: {
				get: function getDefaultPlaybackRate() {
					return 1;
				}
			},

			/**
			 * @property error {OGVMediaError|null}
			 */
			error: {
				get: function getError() {
					if (this._state === State.ERROR) {
						if (this._mediaError) {
							return this._mediaError;
						} else {
							return new OGVMediaError("unknown error occurred in media procesing");
						}
					} else {
						return null;
					}
				}
			},

			/**
			 * @property preload {string}
			 */
			preload: {
				get: function getPreload() {
					return this.getAttribute('preload') || '';
				},
				set: function setPreload(val) {
					this.setAttribute('preload', val);
				}
			},

			/**
			 * @property readyState {number}
			 * @todo return more accurate info about availability of data
			 */
			readyState: {
				get: function getReadyState() {
					if (this._stream && this._codec && this._codec.loadedMetadata) {
						// for now we don't really calc this stuff
						// just pretend we have lots of data coming in already
						return OGVPlayer.HAVE_ENOUGH_DATA;
					} else {
						return OGVPlayer.HAVE_NOTHING;
					}
				}
			},

			/**
			 * @property networkState {number}
			 * @todo implement
			 */
			networkState: {
				get: function getNetworkState() {
					if (this._stream) {
						if (this._stream.waiting) {
							return OGVPlayer.NETWORK_LOADING;
						} else {
							return OGVPlayer.NETWORK_IDLE;
						}
					} else {
						if (this.readyState == OGVPlayer.HAVE_NOTHING) {
							return OGVPlayer.NETWORK_EMPTY;
						} else {
							return OGVPlayer.NETWORK_NO_SOURCE;
						}
					}
				}
			},

			/**
			 * @property playbackRate {number}
			 */
			playbackRate: {
				get: function getPlaybackRate() {
					return this._playbackRate;
				},
				set: function setPlaybackRate(val) {
					var newRate = Number(val) || 1.0;
					if (this._audioFeeder) {
						this._audioFeeder.tempo = newRate;
					} else if (!this._paused) { // Change while playing
						// Move to the coordinate system created by the new tempo
						this._initialPlaybackOffset = this._getPlaybackTime();
						this._initialPlaybackPosition = newRate * getTimestamp() / 1000;
					}
					this._playbackRate = newRate;
					this._fireEventAsync('ratechange');
				}
			},

			/**
			 * @property played {OGVTimeRanges}
			 * @todo implement correctly more or less
			 */
			played: {
				get: function getPlayed() {
					return new OGVTimeRanges([[0, this.currentTime]]);
				}
			},

			/**
			 * @property volume {number}
			 */
			volume: {
				get: function getVolume() {
					return this._volume;
				},
				set: function setVolume(val) {
					this._volume = +val;
					if (this._audioFeeder) {
						this._audioFeeder.volume = this._volume;
					}
					this._fireEventAsync('volumechange');
				}
			}
		});


		// Events!

		/**
		 * custom onframecallback, takes frame decode time in ms
		 */
		this.onframecallback = null;

		/**
		 * Network state events
		 * @todo implement
		 */
		this.onloadstate = null;
		this.onprogress = null;
		this.onsuspend = null;
		this.onabort = null;
		this.onemptied = null;
		this.onstalled = null;

		/**
		 * Called when all metadata is available.
		 * Note in theory we must know 'duration' at this point.
		 */
		this.onloadedmetadata = null;

		/**
		 * Called when enough data for first frame is ready.
		 * @todo implement
		 */
		this.onloadeddata = null;

		/**
		 * Called when enough data is ready to start some playback.
		 * @todo implement
		 */
		this.oncanplay = null;

		/**
		 * Called when enough data is ready to play through to the
		 * end if no surprises in network download rate.
		 * @todo implement
		 */
		this.oncanplaythrough = null;

		/**
		 * Called when playback continues after a stall
		 * @todo implement
		 */
		this.onplaying = null;

		/**
		 * Called when playback is delayed waiting on data
		 * @todo implement
		 */
		this.onwaiting = null;

		/**
		 * Called when seeking begins
		 * @todo implement
		 */
		this.onseeking = null;

		/**
		 * Called when seeking ends
		 * @todo implement
		 */
		this.onseeked = null;

		/**
		 * Called when playback ends
		 */
		this.onended = null;

		/**
		 * Called when duration becomes known
		 * @todo implement
		 */
		this.ondurationchange = null;

		/**
		 * Called periodically during playback
		 */
		this.ontimeupdate = null;

		/**
		 * Called when we start playback
		 */
		this.onplay = null;

		/**
		 * Called when we get paused
		 */
		this.onpause = null;

		/**
		 * Called when the playback rate changes
		 * @todo implement
		 */
		this.onratechange = null;

		/**
		 * Called when the size of the video stream changes
		 * @todo implement
		 */
		this.onresize = null;

		/**
		 * Called when the volume setting changes
		 * @todo implement
		 */
		this.onvolumechange = null;

		/**
		 * Called when the audio feeder is created
		 * This allows for modifying the instance for special audio processing
		 */
		this.onaudiofeedercreated = null;
	}

	_time(cb) {
		let start = getTimestamp();
		cb();
		let delta = getTimestamp() - start;
		this._lastFrameDecodeTime += delta;
		return delta;
	}

	_log(msg) {
		let options = this._options;
		if (options.debug) {
			let now = getTimestamp(),
				delta = now - this._startTime;

			//console.log('+' + delta + 'ms ' + msg);
			//then = now;

			if (!options.debugFilter || msg.match(options.debugFilter)) {
				console.log('[' + (Math.round(delta * 10) / 10) + 'ms] ' + msg);
			}
		}
	}

	_fireEvent(eventName, props={}) {
		this._log('fireEvent ' + eventName);

		let standard = (typeof Event == 'function');
		let event;
		if (standard) {
			// standard event creation
			event = new CustomEvent(eventName);
		} else {
			// IE back-compat mode
			// https://msdn.microsoft.com/en-us/library/dn905219%28v=vs.85%29.aspx
			event = document.createEvent('Event');
			event.initEvent(eventName, false, false);
		}

		for (let prop in props) {
			if (props.hasOwnProperty(prop)) {
				event[prop] = props[prop];
			}
		}

		let allowDefault = this.dispatchEvent(event);
		if (!standard && eventName === 'resize' && this.onresize && allowDefault) {
			// resize demands special treatment!
			// in IE 11 it doesn't fire through to the .onresize handler
			// for some crazy reason
			this.onresize.call(this, event);
		}
	}

	_fireEventAsync(eventName, props={}) {
		this._log('fireEventAsync ' + eventName);
		setImmediate(() => {
			this._fireEvent(eventName, props);
		});
	}

	static initSharedAudioContext() {
		AudioFeeder.initSharedAudioContext();
	}

	_initAudioFeeder() {
		let options = this._options;
		let audioOptions = {
			// Pass the resource dir down to AudioFeeder, so it can load the dynamicaudio.swf
			base: options.base || OGVLoader.base,

			// Buffer in largeish chunks to survive long CPU spikes on slow CPUs (eg, 32-bit iOS)
			bufferSize: 8192,
		};
		if (options.audioContext) {
			// Try passing a pre-created AudioContext in?
			audioOptions.audioContext = options.audioContext;
		}
		if (options.audioDestination) {
			// Try passing a pre-created output node in?
			audioOptions.output = options.audioDestination;
		}
		if (options.audioBackendFactory) {
			// Allow setting a custom backend for audioFeeder
			audioOptions.backendFactory = options.audioBackendFactory;
		}

		if (this._video && !audioOptions.output) {
			// Set up an audio route...
			if (!audioOptions.audioContext) {
				// We need the AudioContext first to create the capture node
				audioOptions.audioContext = AudioFeeder.initSharedAudioContext();
			}
			let dest = audioOptions.audioContext.createMediaStreamDestination();

			this._audioTrack = dest.stream.getAudioTracks()[0];
			this._mediaStream.addTrack(this._audioTrack);
			this._video.play();

			audioOptions.output = dest;
		}

		let audioFeeder = this._audioFeeder = new AudioFeeder(audioOptions);
		audioFeeder.init(this._audioInfo.channels, this._audioInfo.rate);

		//Fire when _audioFeeder is populated
		if (this.onaudiofeedercreated)
			this.onaudiofeedercreated(this._audioFeeder);

		// At our requested 8192 buffer size, bufferDuration should be
		// about 185ms at 44.1 kHz or 170ms at 48 kHz output, covering
		// 4-6 frames at 24-30fps.
		//
		// 2 or 3 buffers' worth will be in flight at any given time;
		// be warned that durationBuffered includes that in-flight stuff.
		//
		// Set our bufferThreshold to a full 1s for plenty of extra headroom,
		// and make sure we've queued up twice that when we're operating.
		audioFeeder.bufferThreshold = 1;

		audioFeeder.volume = this.volume;
		audioFeeder.muted = this.muted;
		audioFeeder.tempo = this.playbackRate;

		// If we're in a background tab, timers may be throttled.
		// audioFeeder will call us when buffers need refilling,
		// without any throttling.
		audioFeeder.onbufferlow = () => {
			this._log('onbufferlow');
			if ((this._stream && (this._stream.buffering || this._stream.seeking)) || this._pendingAudio) {
				// We're waiting on input or other async processing;
				// we'll get triggered later.
			} else {
				// We're in an async event so it's safe to run the loop:
				this._pingProcessing();
			}
		};

		// If we ran out of audio *completely* schedule some more processing.
		// This shouldn't happen if we keep up with onbufferlow.
		audioFeeder.onstarved = () => {
			if (this._dataEnded) {
				// Probably end of file.
				// Do nothing!
				this._log('onstarved: appear to have reached end of audio');
			} else {
				this._log('onstarved: halting audio due to starvation');
				this._stopPlayback();
				this._prebufferingAudio = true;
			}
			if (this._isProcessing()) {
				// We're waiting on input or other async processing;
				// we'll get triggered later.
			} else {
				// Schedule loop after this synchronous event.
				this._pingProcessing(0);
			}
		};
	}

	_startPlayback(offset) {
		if (this._audioFeeder) {
			this._audioFeeder.start();
			let state = this._audioFeeder.getPlaybackState();
			this._initialPlaybackPosition = state.playbackPosition;
		} else {
			this._initialPlaybackPosition = this._playbackRate * getTimestamp() / 1000;
		}
		if (offset !== undefined) {
			this._initialPlaybackOffset = offset;
		}
		// Clear the late flag if it was set.
		this._prebufferingAudio = false;
		this._log('continuing at ' + this._initialPlaybackPosition + ', ' + this._initialPlaybackOffset);
	}

	_stopPlayback() {
		this._initialPlaybackOffset = this._getPlaybackTime();
		this._log('pausing at ' + this._initialPlaybackOffset);
		if (this._audioFeeder) {
			this._audioFeeder.stop();
		}
	}

	/**
	 * Get audio playback time position in file's units
	 *
	 * @return {number} seconds since file start
	 */
	_getPlaybackTime(state) {
		if (this._prebufferingAudio || this._paused) {
			return this._initialPlaybackOffset;
		} else {
			let position;
			if (this._audioFeeder) {
				state = state || this._audioFeeder.getPlaybackState();
				position = state.playbackPosition;
			} else {
				// @fixme handle paused/stoped time better
				position = this._playbackRate * getTimestamp() / 1000;
			}
			return (position - this._initialPlaybackPosition) + this._initialPlaybackOffset;
		}
	}

	// called when stopping old video on load()
	_stopVideo() {
		this._log("STOPPING");
		// kill the previous video if any
		this._state = State.INITIAL;
		this._seekState = SeekState.NOT_SEEKING;
		this._started = false;
		//this._paused = true; // don't change this?
		this._ended = false;
		this._frameEndTimestamp = 0.0;
		this._audioEndTimestamp = 0.0;
		this._lastFrameDecodeTime = 0.0;
		this._prebufferingAudio = false;

		// Abort all queued actions
		this._actionQueue.splice(0, this._actionQueue.length);

		if (this._stream) {
			// @todo fire an abort event if still loading
			// @todo fire an emptied event if previously had data
			this._stream.abort();
			this._stream = null;
			this._streamEnded = false;
		}
		if (this._codec) {
			this._codec.close();
			this._codec = null;
			this._pendingFrame = 0;
			this._pendingAudio = 0;
			this._dataEnded = false;
		}
		this._videoInfo = null;
		this._audioInfo = null;
		if (this._audioFeeder) {
			this._audioFeeder.close();
			this._audioFeeder = null;
		}
		if (this._nextProcessingTimer) {
			clearTimeout(this._nextProcessingTimer);
			this._nextProcessingTimer = null;
		}
		if (this._nextFrameTimer) {
			clearTimeout(this._nextFrameTimer);
			this._nextFrameTimer = null;
		}
		if (this._frameSink) {
			this._frameSink.clear();
			this._frameSink = null;
		}
		if (this._decodedFrames) {
			this._decodedFrames = [];
		}
		if (this._pendingFrames) {
			this._pendingFrames = [];
		}
		this._initialSeekTime = 0.0;
		// @todo set playback position, may need to fire timeupdate if wasnt previously 0
		this._initialPlaybackPosition = 0;
		this._initialPlaybackOffset = 0;
		this._duration = null; // do not fire durationchange
		// timeline offset to 0?
	}

	_doFrameComplete(data={}) {
		if (this._startedPlaybackInDocument && !document.body.contains(this)) {
			// We've been de-parented since we last ran
			// Stop playback at next opportunity!
			setImmediate(() => {
				this.stop();
			});
		}

		let newFrameTimestamp = getTimestamp(),
			wallClockTime = newFrameTimestamp - this._lastFrameTimestamp,
			//jitter = wallClockTime - this._targetPerFrameTime;
			jitter = this._actualPerFrameTime - this._targetPerFrameTime;
		this._totalJitter += Math.abs(jitter);
		this._playTime += wallClockTime;

		let timing = {
			cpuTime: this._lastFrameDecodeTime,
			drawingTime: this._drawingTime - this._lastFrameDrawingTime,
			bufferTime: this._bufferTime - this._lastFrameBufferTime,
			proxyTime: this._proxyTime - this._lastFrameProxyTime,

			demuxerTime: 0,
			videoTime: 0,
			audioTime: 0,
			//clockTime: wallClockTime
			clockTime: this._actualPerFrameTime,

			late: data.dropped,
			dropped: data.dropped
		};
		if (this._codec) {
			timing.demuxerTime = (this._codec.demuxerCpuTime - this._lastFrameDemuxerCpuTime);
			timing.videoTime += (this._currentVideoCpuTime - this._lastFrameVideoCpuTime);
			timing.audioTime += (this._codec.audioCpuTime - this._lastFrameAudioCpuTime);
		}
		timing.cpuTime += timing.demuxerTime;
		this._lastFrameDecodeTime = 0;
		this._lastFrameTimestamp = newFrameTimestamp;
		if (this._codec) {
			this._lastFrameVideoCpuTime = this._currentVideoCpuTime;
			this._lastFrameAudioCpuTime = this._codec.audioCpuTime;
			this._lastFrameDemuxerCpuTime = this._codec.demuxerCpuTime;
		} else {
			this._lastFrameVideoCpuTime = 0;
			this._lastFrameAudioCpuTime = 0;
			this._lastFrameDemuxerCpuTime = 0;
		}
		this._lastFrameDrawingTime = this._drawingTime;
		this._lastFrameBufferTime = this._bufferTime;
		this._lastFrameProxyTime = this._proxyTime;

		function n(x) {
			return Math.round(x * 10) / 10;
		}
		this._log('drew frame ' + data.frameEndTimestamp + ': ' +
			'clock time ' + n(wallClockTime) + ' (jitter ' + n(jitter) + ') ' +
			'cpu: ' + n(timing.cpuTime) + ' (mux: ' + n(timing.demuxerTime) + ' buf: ' + n(timing.bufferTime) + ' draw: ' + n(timing.drawingTime) + ' proxy: ' + n(timing.proxyTime) + ') ' +
			'vid: ' + n(timing.videoTime) + ' aud: ' + n(timing.audioTime));
		this._fireEventAsync('framecallback', timing);

		if (!this._lastTimeUpdate || (newFrameTimestamp - this._lastTimeUpdate) >= this._timeUpdateInterval) {
			this._lastTimeUpdate = newFrameTimestamp;
			this._fireEventAsync('timeupdate');
		}
	}

	_seekStream(offset) {
		if (this._stream.seeking) {
			this._stream.abort();
		}
		if (this._stream.buffering) {
			this._stream.abort();
		}
		this._streamEnded = false;
		this._dataEnded = false;
		this._ended = false;
		this._stream.seek(offset).then(() => {
			this._readBytesAndWait();
		}).catch((e) => {
			this._onStreamError(e);
		});
	}

	_onStreamError(err) {
		if (err.name === 'AbortError') {
			// do nothing
			this._log('i/o promise canceled; ignoring');
		} else {
			this._log("i/o error: " + err);
			this._mediaError = new OGVMediaError(OGVMediaError.MEDIA_ERR_NETWORK, String(err));
			this._state = State.ERROR;
			this._stopPlayback();
		}
	}

	_seek(toTime, mode) {
		this._log('requested seek to ' + toTime + ', mode ' + mode);

		if (this.readyState == this.HAVE_NOTHING) {
			this._log('not yet loaded; saving seek position for later');
			this._initialSeekTime = toTime;
			return;
		}

		if (this._stream && !this._stream.seekable) {
			throw new Error('Cannot seek a non-seekable stream');
		}

		if (this._codec && !this._codec.seekable) {
			throw new Error('Cannot seek in a non-seekable file');
		}

		let prepForSeek = (callback) => {
			if (this._stream && this._stream.buffering) {
				this._stream.abort();
			}
			if (this._stream && this._stream.seeking) {
				this._stream.abort();
			}
			// clear any queued input/seek-start
			this._actionQueue.splice(0, this._actionQueue.length);
			this._stopPlayback();
			this._prebufferingAudio = false;
			if (this._audioFeeder) {
				this._audioFeeder.flush();
			}
			this._state = State.SEEKING;
			this._seekTargetTime = toTime;
			this._seekMode = mode;
			if (this._codec) {
				this._codec.flush(callback);
			} else {
				callback();
			}
		};

		// Abort any previous seek or play suitably
		prepForSeek(() => {
			if (this._isProcessing()) {
				// already waiting on input
			} else {
				// start up the new load *after* event loop churn
				this._pingProcessing(0);
			}
		});

		this._actionQueue.push(() => {
			// Just in case another async task stopped us...
			prepForSeek(() => {
				this._doSeek(toTime);
			});
		});
	}

	_doSeek(toTime) {
		this._streamEnded = false;
		this._dataEnded = false;
		this._ended = false;
		this._state = State.SEEKING;
		this._seekTargetTime = toTime;
		this._lastSeekPosition = -1;

		this._decodedFrames = [];
		this._pendingFrames = [];
		this._pendingFrame = 0;
		this._pendingAudio = 0;

		this._didSeek = false;
		this._codec.seekToKeypoint(toTime, (seeking) => {
			if (seeking) {
				this._seekState = SeekState.LINEAR_TO_TARGET;
				this._fireEventAsync('seeking');

				if (this._didSeek) {
					// wait for i/o to trigger readBytesAndWait
					return;
				} else {
					this._pingProcessing();
					return;
				}
			}
			// Use the old interface still implemented on ogg demuxer
			this._codec.getKeypointOffset(toTime, (offset) => {
				if (offset > 0) {
					// This file has an index!
					//
					// Start at the keypoint, then decode forward to the desired time.
					//
					this._seekState = SeekState.LINEAR_TO_TARGET;
					this._seekStream(offset);
				} else {
					// No index.
					//
					// Bisect through the file finding our target time, then we'll
					// have to do it again to reach the keypoint, and *then* we'll
					// have to decode forward back to the desired time.
					//
					this._seekState = SeekState.BISECT_TO_TARGET;
					this._startBisection(this._seekTargetTime);
				}

				this._fireEventAsync('seeking');
			});
		});
	}

	_startBisection(targetTime) {
		// leave room for potentially long Ogg page syncing
		let endPoint = Math.max(0, this._stream.length - 65536);

		this._bisectTargetTime = targetTime;
		this._seekBisector = new Bisector({
			start: 0,
			end: endPoint,
			process: (start, end, position) => {
				if (position == this._lastSeekPosition) {
					return false;
				} else {
					this._lastSeekPosition = position;
					this._codec.flush(() => {
						this._seekStream(position);
					});
					return true;
				}
			}
		});
		this._seekBisector.start();
	}

	_continueSeekedPlayback() {
		this._seekState = SeekState.NOT_SEEKING;
		this._state = State.READY;
		this._frameEndTimestamp = this._codec.frameTimestamp;
		this._audioEndTimestamp = this._codec.audioTimestamp;
		if (this._codec.hasAudio) {
			this._seekTargetTime = this._codec.audioTimestamp;
		} else {
			this._seekTargetTime = this._codec.frameTimestamp;
		}
		this._initialPlaybackOffset = this._seekTargetTime;

		let finishedSeeking = () => {
			this._lastTimeUpdate = this._seekTargetTime;
			this._fireEventAsync('timeupdate');
			this._fireEventAsync('seeked');
			if (this._isProcessing()) {
				// wait for whatever's going on to complete
			} else {
				this._pingProcessing();
			}
		}

		if (this._codec.hasVideo && this._decodedFrames.length) {
			// We landed between frames. Show the last frame.
			let frame = this._decodedFrames.shift();
			this._drawFrame(frame.yCbCrBuffer)
			finishedSeeking();
		} else if (this._codec.hasVideo && this._codec.frameReady) {
			// Exact seek, no decoded frames.
			//
			// Decode and show first frame immediately
			// hack! move this into the main loop when retooling
			// to avoid maintaining this double draw
			this._codec.decodeFrame((ok) => {
				if (ok) {
					this._drawFrame(this._codec.frameBuffer);
				}
				finishedSeeking();
			} );
			this._codec.sync();
			return;
		} else {
			finishedSeeking();
		}
	}

	_drawFrame(buffer) {
		if (this._thumbnail) {
			this.removeChild(this._thumbnail);
			this._thumbnail = null;
		}
		this._frameSink.drawFrame(buffer);

		if (this._video) {
			if (!this._canvasStream) {
				this._canvasStream = this._canvas.captureStream(0);
				this._videoTrack = this._canvasStream.getVideoTracks()[0];
				this._mediaStream.addTrack(this._videoTrack);
			}

			// Update the media stream with the new frame, so we don't
			// have to fake a constant frame rate that might be too high
			// or too low.
			if (this._videoTrack && this._videoTrack.requestFrame) {
				this._videoTrack.requestFrame();
			} else if (this._canvasStream && this._canvasStream.requestFrame) {
				this._canvasStream.requestFrame();
			}
		}
	}

	/**
	 * @return {boolean} true to continue processing, false to wait for input data
	 */
	_doProcessLinearSeeking() {
		let frameDuration;
		if (this._codec.hasVideo) {
			frameDuration = this._targetPerFrameTime / 1000;
		} else {
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		}

		if (this._codec.hasVideo) {
			if (this._pendingFrame) {
				// wait
				return;
			} else if (!this._codec.frameReady) {
				// Haven't found a frame yet, process more data
				this._codec.process((more) => {
					if (more) {
						// need more packets
						this._pingProcessing();
					} else if (this._streamEnded) {
						this._log('stream ended during linear seeking on video');
						this._dataEnded = true;
						this._continueSeekedPlayback();
					} else {
						this._readBytesAndWait();
					}
				});
				return;
			} else if (this._seekMode === SeekMode.FAST && this._codec.keyframeTimestamp == this._codec.frameTimestamp) {
				// Found some frames? Go ahead now!
				this._continueSeekedPlayback();
				return;
			} else if (this._codec.frameTimestamp <= this._seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time,
				// Or reached the target time and ready to decode and show.
				// Decode it in case we're at our keyframe or a following intraframe,
				// or if it's a match because we need to show it immediately.
				let nextFrameEndTimestamp = this._codec.frameTimestamp;
				this._pendingFrame++;
				this._pendingFrames.push({
					frameEndTimestamp: nextFrameEndTimestamp
				});
				this._decodedFrames.splice(0, this._decodedFrames.length);
				this._codec.decodeFrame((ok) => {
					this._pendingFrame--;
					this._pendingFrames.shift();
					this._decodedFrames.push({
						yCbCrBuffer: this._codec.frameBuffer,
						videoCpuTime: this._codec.videoCpuTime,
						frameEndTimestamp: nextFrameEndTimestamp
					});
					this._pingProcessing();
				});
				this._codec.sync();
				return;
			} else {
				// Reached or surpassed the target time.
				if (this._codec.hasAudio) {
					// Keep processing the audio track
					// fall through...
				} else {
					this._continueSeekedPlayback();
					return;
				}
			}
		}
		if (this._codec.hasAudio) {
			if (this._pendingAudio) {
				// wait
				return;
			} if (!this._codec.audioReady) {
				// Haven't found an audio packet yet, process more data
				this._codec.process((more) => {
					if (more) {
						// need more packets
						this._pingProcessing();
					} else if (this._streamEnded) {
						this._log('stream ended during linear seeking on audio');
						this._dataEnded = true;
						this._continueSeekedPlayback();
					} else {
						this._readBytesAndWait();
					}
				});
				return;
			} else if (this._codec.audioTimestamp + frameDuration < this._seekTargetTime) {
				// Haven't found a time yet, or haven't reached the target time.
				// Decode it so when we reach the target we've got consistent data.
				this._codec.decodeAudio(() => {
					this._pingProcessing();
				});
				return;
			} else {
				this._continueSeekedPlayback();
				return;
			}
		}
	}

	_doProcessBisectionSeek() {
		let frameDuration,
			timestamp;
		if (this._codec.hasVideo) {
			timestamp = this._codec.frameTimestamp;
			frameDuration = this._targetPerFrameTime / 1000;
		} else if (this._codec.hasAudio) {
			timestamp = this._codec.audioTimestamp;
			frameDuration = 1 / 256; // approximate packet audio size, fake!
		} else {
			throw new Error('Invalid seek state; no audio or video track available');
		}

		if (timestamp < 0) {
			// Haven't found a packet yet.
			this._codec.process((more) => {
				if (more) {
					// need more data
					this._pingProcessing();
				} else if (this._streamEnded) {
					this._log('stream ended during bisection seek');
					// We may have to go back further to find packets.
					if (this._seekBisector.right()) {
						// wait for new data to come in
					} else {
						this._log('failed going back');
						throw new Error('not sure what to do');
					}
				} else {
					this._readBytesAndWait();
				}
			});
		} else if (timestamp - frameDuration / 2 > this._bisectTargetTime) {
			if (this._seekBisector.left()) {
				// wait for new data to come in
			} else {
				this._log('close enough (left)');

				// We're having trouble finding a new packet position;
				// likely it's an audio file with lots of small packets.
				// Since we can't find an earlier packet, just continue here.
				this._seekTargetTime = timestamp;
				this._continueSeekedPlayback();
			}
		} else if (timestamp + frameDuration / 2 < this._bisectTargetTime) {
			if (this._seekBisector.right()) {
				// wait for new data to come in
			} else {
				this._log('close enough (right)');

				// We're having trouble finding a new packet position;
				// likely it's an audio file with lots of small packets.
				// Switch to linear mode to find the final target.
				this._seekState = SeekState.LINEAR_TO_TARGET;
				this._pingProcessing();
			}
		} else {
			// Reached the bisection target!
			if (this._seekState == SeekState.BISECT_TO_TARGET && (this._codec.hasVideo && this._codec.keyframeTimestamp < this._codec.frameTimestamp)) {
				// We have to go back and find a keyframe. Sigh.
				this._log('finding the keypoint now');
				this._seekState = SeekState.BISECT_TO_KEYPOINT;
				this._startBisection(this._codec.keyframeTimestamp);
			} else {
				this._log('straight seeking now');
				// Switch to linear mode to find the final target.
				this._seekState = SeekState.LINEAR_TO_TARGET;
				this._pingProcessing();
			}
		}
	}

	_setupVideo() {
		if (this._videoInfo.fps > 0) {
			this._targetPerFrameTime = 1000 / this._videoInfo.fps;
		} else {
			this._targetPerFrameTime = 16.667; // recalc this later
		}

		this._canvas.width = this._videoInfo.displayWidth;
		this._canvas.height = this._videoInfo.displayHeight;
		OGVPlayer.styleManager.appendRule('.' + this._instanceId, {
			width: this._videoInfo.displayWidth + 'px',
			height: this._videoInfo.displayHeight + 'px'
		});
		OGVPlayer.updatePositionOnResize();

		let canvasOptions = {};
		if (this._options.webGL !== undefined) {
			// @fixme confirm format of webGL option
			canvasOptions.webGL = this._options.webGL;
		}
		if(!!this._options.forceWebGL) {
			canvasOptions.webGL = 'required';
		}

		this._frameSink = YUVCanvas.attach(this._canvas, canvasOptions);
	}

	_doProcessing() {
		if (this._didSeek) {
			this._didSeek = false;
		}
		this._nextProcessingTimer = null;

		if (this._isProcessing()) {
			// Called async while waiting for something else to complete...
			// let it finish, then we'll get called again to continue.
			//return;
			//throw new Error('REENTRANCY FAIL: doProcessing during processing');
		}

		if (this._depth > 0) {
			throw new Error('REENTRANCY FAIL: doProcessing recursing unexpectedly');
		}
		let iters = 0;
		do {
			this._needProcessing = false;
			this._depth++;
			this._doProcessingLoop();
			this._depth--;

			if (this._needProcessing && this._isProcessing()) {
				throw new Error('REENTRANCY FAIL: waiting on input or codec but asked to keep processing');
			}
			if (++iters > 500) {
				this._log('stuck in processing loop; breaking with timer');
				this._needProcessing = 0;
				this._pingProcessing(0);
			}
		} while (this._needProcessing);
	}

	_doProcessingLoop() {

		if (this._actionQueue.length) {
			// data or user i/o to process in our serialized event stream
			// The function should eventually bring us back here via pingProcessing(),
			// directly or via further i/o.

			let action = this._actionQueue.shift();
			action();

		} else if (this._state == State.INITIAL) {

			this._doProcessInitial();

		} else if (this._state == State.SEEKING_END) {

			this._doProcessSeekingEnd();

		} else if (this._state == State.LOADED) {

			this._doProcessLoaded();

		} else if (this._state == State.PRELOAD) {

			this._doProcessPreload();

		} else if (this._state == State.READY) {

			this._doProcessReady();


		} else if (this._state == State.SEEKING) {

			this._doProcessSeeking();

		} else if (this._state == State.PLAYING) {

			this._doProcessPlay();

		} else if (this._state == State.ERROR) {

			this._doProcessError();

		} else {

			throw new Error('Unexpected OGVPlayer state ' + this._state);

		}
	}

	_doProcessInitial() {
		if (this._codec.loadedMetadata) {
			// we just fell over from headers into content; call onloadedmetadata etc
			if (!this._codec.hasVideo && !this._codec.hasAudio) {
				throw new Error('No audio or video found, something is wrong');
			}
			if (this._codec.hasAudio) {
				this._audioInfo = this._codec.audioFormat;
			}
			if (this._codec.hasVideo) {
				this._videoInfo = this._codec.videoFormat;
				this._setupVideo();
			}
			if (!isNaN(this._codec.duration)) {
				this._duration = this._codec.duration;
			}
			if (this._duration === null) {
				if (this._stream.seekable) {
					// fixme this is ogg-specific maybe?
					this._state = State.SEEKING_END;
					this._lastSeenTimestamp = -1;
					this._codec.flush(() => {
						this._seekStream(Math.max(0, this._stream.length - 65536 * 2));
					});
				} else {
					// Stream not seekable and no x-content-duration; assuming infinite stream.
					this._state = State.LOADED;
					this._pingProcessing();
				}
			} else {
				// We already know the duration.
				this._state = State.LOADED;
				this._pingProcessing();
			}
		} else {
			this._codec.process((more) => {
				if (more) {
					// Keep processing headers
					this._pingProcessing();
				} else if (this._streamEnded) {
					throw new Error('end of file before headers found');
				} else {
					// Read more data!
					this._log('reading more cause we are out of data');
					this._readBytesAndWait();
				}
			});
		}
	}

	_doProcessSeekingEnd() {
		// Look for the last item.
		if (this._codec.frameReady) {
			this._log('saw frame with ' + this._codec.frameTimestamp);
			this._lastSeenTimestamp = Math.max(this._lastSeenTimestamp, this._codec.frameTimestamp);
			this._codec.discardFrame(() => {
				this._pingProcessing();
			});
		} else if (this._codec.audioReady) {
			this._log('saw audio with ' + this._codec.audioTimestamp);
			this._lastSeenTimestamp = Math.max(this._lastSeenTimestamp, this._codec.audioTimestamp);
			this._codec.discardAudio(() => {
				this._pingProcessing();
			});
		} else {
			this._codec.process((more) => {
				if (more) {
					// Keep processing headers
					this._pingProcessing();
				} else {
					// Read more data!
					if (!this._stream.eof) {
						this._readBytesAndWait();
					} else {
						// We are at the end!
						this._log('seek-duration: we are at the end: ' + this._lastSeenTimestamp);
						if (this._lastSeenTimestamp > 0) {
							this._duration = this._lastSeenTimestamp;
						}

						// Ok, seek back to the beginning and resync the streams.
						this._state = State.LOADED;
						this._codec.flush(() => {
							this._streamEnded = false;
							this._dataEnded = false;
							this._seekStream(0);
						});
					}
				}
			});
		}
	}

	_doProcessLoaded() {
		this._state = State.PRELOAD;
		this._fireEventAsync('loadedmetadata');
		this._fireEventAsync('durationchange');
		if (this._codec.hasVideo) {
			this._fireEventAsync('resize');
		}
		this._pingProcessing(0);
	}

	_doProcessPreload() {
		if ((this._codec.frameReady || !this._codec.hasVideo) &&
			(this._codec.audioReady || !this._codec.hasAudio)) {

			this._state = State.READY;
			this._fireEventAsync('loadeddata');
			this._pingProcessing();
		} else {
			this._codec.process((more) => {
				if (more) {
					this._pingProcessing();
				} else if (this._streamEnded) {
					// Ran out of data before data available...?
					this._ended = true;
				} else {
					this._readBytesAndWait();
				}
			});
		}
	}

	_doProcessReady() {
		this._log('initial seek to ' + this._initialSeekTime);

		if (this._initialSeekTime > 0) {

			let target = this._initialSeekTime;
			this._initialSeekTime = 0;
			this._log('initial seek to ' + target);
			this._doSeek(target);

		} else if (this._paused) {

			// Paused? stop here.
			this._log('paused while in ready');

		} else {

			let finishStartPlaying = () => {
				this._log('finishStartPlaying');

				this._state = State.PLAYING;
				this._lastFrameTimestamp = getTimestamp();

				if (this._codec.hasAudio && this._audioFeeder) {
					// Pre-queue audio before we start the clock
					this._prebufferingAudio = true;
				} else {
					this._startPlayback();
				}
				this._pingProcessing(0);
				this._fireEventAsync('play');
				this._fireEventAsync('playing');
			}

			if (this._codec.hasAudio && !this._audioFeeder && !this._muted) {
				this._initAudioFeeder();
				this._audioFeeder.waitUntilReady(finishStartPlaying);
			} else {
				finishStartPlaying();
			}
		}
	}

	_doProcessSeeking() {
		if (this._seekState == SeekState.NOT_SEEKING) {
			throw new Error('seeking in invalid state (not seeking?)');
		} else if (this._seekState == SeekState.BISECT_TO_TARGET) {
			this._doProcessBisectionSeek();
		} else if (this._seekState == SeekState.BISECT_TO_KEYPOINT) {
			this._doProcessBisectionSeek();
		} else if (this._seekState == SeekState.LINEAR_TO_TARGET) {
			this._doProcessLinearSeeking();
		} else {
			throw new Error('Invalid seek state ' + this._seekState);
		}
	}

	_doProcessPlay() {

		let codec = this._codec;

		if (this._paused) {

			// ok we're done for now!
			this._log('paused during playback; stopping loop');

		} else {

			if ((!codec.hasAudio || codec.audioReady || this._pendingAudio || this._dataEnded) &&
				(!codec.hasVideo || codec.frameReady || this._pendingFrame || this._decodedFrames.length || this._dataEnded)
			) {

				var audioState = null,
					playbackPosition = 0,
					readyForAudioDecode,
					audioEnded = false,
					readyForFrameDraw,
					frameDelay = 0,
					readyForFrameDecode,
					// timers never fire earlier than 4ms
					timerMinimum = 4,
					// ok to draw a couple ms early
					fudgeDelta = timerMinimum;


				if (codec.hasAudio && this._audioFeeder) {
					// Drive on the audio clock!

					audioState = this._audioFeeder.getPlaybackState();
					playbackPosition = this._getPlaybackTime(audioState);
					audioEnded = (this._dataEnded && this._audioFeeder.durationBuffered == 0);

					if (this._prebufferingAudio && (
						(
							this._audioFeeder.durationBuffered >= this._audioFeeder.bufferThreshold * 2 &&
							(!codec.hasVideo || this._decodedFrames.length >= this._framePipelineDepth)
						) || this._dataEnded)
					) {
						this._log('prebuffering audio done; buffered to ' + this._audioFeeder.durationBuffered);
						this._startPlayback(playbackPosition);
						this._prebufferingAudio = false;
					}

					if (audioState.dropped != this._droppedAudio) {
						this._log('dropped ' + (audioState.dropped - this._droppedAudio));
					}
					if (audioState.delayed != this._delayedAudio) {
						this._log('delayed ' + (audioState.delayed - this._delayedAudio));
					}
					this._droppedAudio = audioState.dropped;
					this._delayedAudio = audioState.delayed;

					readyForAudioDecode = this._audioFeeder.durationBuffered <=
						this._audioFeeder.bufferThreshold * 2;

					if (!readyForAudioDecode) {
						// just to skip the remaining items in debug log
					} else if (!this._codec.audioReady) {
						// NEED MOAR BUFFERS
						readyForAudioDecode = false;
					} else if (this._pendingAudio >= this._audioPipelineDepth) {
						// We'll check in when done decoding
						this._log('audio decode disabled: ' + this._pendingAudio + ' packets in flight');
						readyForAudioDecode = false;
					}

				} else {
					// No audio; drive on the general clock.
					// @fixme account for dropped frame times...
					playbackPosition = this._getPlaybackTime();

					// If playing muted with no audio output device,
					// just keep up with audio in general.
					readyForAudioDecode = this._codec.audioReady && (this._audioEndTimestamp < playbackPosition);
				}

				if (this._codec.hasVideo) {
					readyForFrameDraw = this._decodedFrames.length > 0;
					readyForFrameDecode = (this._pendingFrame + this._decodedFrames.length < this._framePipelineDepth + this._frameParallelism) && this._codec.frameReady;

					if (readyForFrameDraw) {
						frameDelay = (this._decodedFrames[0].frameEndTimestamp - playbackPosition) * 1000;
						this._actualPerFrameTime = this._targetPerFrameTime - frameDelay;
						//frameDelay = Math.max(0, frameDelay);
						//frameDelay = Math.min(frameDelay, this._targetPerFrameTime);
					}

					let audioSyncThreshold = this._targetPerFrameTime;
					if (this._prebufferingAudio) {
						if (readyForFrameDecode) {
							this._log('decoding a frame during prebuffering');
						}
						readyForFrameDraw = false;
					} else if (readyForFrameDraw && this._dataEnded && audioEnded) {
						// If audio timeline reached end, make sure the last frame draws
						this._log('audio timeline ended? ready to draw frame');
					} else if (readyForFrameDraw && -frameDelay >= audioSyncThreshold) {
						// late frame!
						let skipPast = -1;
						for (let i = 0; i < this._decodedFrames.length - 1; i++) {
							if (this._decodedFrames[i].frameEndTimestamp < playbackPosition) {
								skipPast = i - 1;
							}
						}
						if (skipPast >= 0) {
							while (skipPast-- >= 0) {
								this._lateFrames++;
								let frame = this._decodedFrames.shift();
								this._log('skipping already-decoded late frame at ' + frame.frameEndTimestamp);
								frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
								this._frameEndTimestamp = frame.frameEndTimestamp;
								this._actualPerFrameTime = this._targetPerFrameTime - frameDelay;
								this._framesProcessed++; // pretend!
								frame.dropped = true;
								this._doFrameComplete(frame);
							}
						}

						// Resync at the next keyframe.
						// @todo make this work when there's no audio stream being decoded ahead
						let nextKeyframe = this._codec.nextKeyframeTimestamp;

						// When resyncing, allow time to decode a couple frames!
						let videoSyncPadding = (this._targetPerFrameTime / 1000) * (this._framePipelineDepth + this._pendingFrame);
						let timeToResync = nextKeyframe - videoSyncPadding;

						if (nextKeyframe >= 0 && nextKeyframe != this._codec.frameTimestamp && playbackPosition  >= timeToResync) {
							this._log('skipping late frame at ' + this._decodedFrames[0].frameEndTimestamp + ' vs ' + playbackPosition + ', expect to see keyframe at ' + nextKeyframe);

							// First skip any already-decoded frames
							for (let i = 0; i < this._decodedFrames.length; i++) {
								let frame = this._decodedFrames[i];
								this._lateFrames++;
								this._framesProcessed++; // pretend!
								this._frameEndTimestamp = frame.frameEndTimestamp;
								frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
								this._actualPerFrameTime = this._targetPerFrameTime - frameDelay;
								frame.dropped = true;
								this._doFrameComplete(frame);
							}
							this._decodedFrames = [];
							for (let i = 0; i < this._pendingFrames.length; i++) {
								let frame = this._pendingFrames[i];
								this._lateFrames++;
								this._framesProcessed++; // pretend!
								this._frameEndTimestamp = frame.frameEndTimestamp;
								frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
								this._actualPerFrameTime = this._targetPerFrameTime - frameDelay;
								frame.dropped = true;
								this._doFrameComplete(frame);
							}
							this._pendingFrames = [];
							this._pendingFrame = 0;

							// Now discard anything up to the keyframe
							while (this._codec.frameReady && this._codec.frameTimestamp < nextKeyframe) {
								// note: this is a known synchronous operation :)
								let frame = {
									frameEndTimestamp: this._codec.frameTimestamp,
									dropped: true
								};
								frameDelay = (frame.frameEndTimestamp - playbackPosition) * 1000;
								this._actualPerFrameTime = this._targetPerFrameTime - frameDelay;
								this._lateFrames++;
								this._codec.discardFrame(() => {/*fake*/});
								this._framesProcessed++; // pretend!
								this._doFrameComplete(frame);
							}
							if (this._isProcessing()) {
								// wait
							} else {
								this._pingProcessing();
							}
							return;
						}
					} else if (readyForFrameDraw && frameDelay <= fudgeDelta) {
						// on time! draw
					} else {
						// not yet
						readyForFrameDraw = false;
					}
				}

				if (readyForFrameDecode) {

					this._log('play loop: ready to decode frame; thread depth: ' + this._pendingFrame + ', have buffered: ' + this._decodedFrames.length);

					if (this._videoInfo.fps == 0 && (this._codec.frameTimestamp - this._frameEndTimestamp) > 0) {
						// WebM doesn't encode a frame rate
						this._targetPerFrameTime = (this._codec.frameTimestamp - this._frameEndTimestamp) * 1000;
					}
					this._totalFrameTime += this._targetPerFrameTime;
					this._totalFrameCount++;

					let nextFrameEndTimestamp = this._frameEndTimestamp = this._codec.frameTimestamp;
					this._pendingFrame++;
					this._pendingFrames.push({
						frameEndTimestamp: nextFrameEndTimestamp
					});
					let currentPendingFrames = this._pendingFrames;
					let wasAsync = false;
					let frameDecodeTime = this._time(() => {
						this._codec.decodeFrame((ok) => {
							if (currentPendingFrames !== this._pendingFrames) {
								this._log('play loop callback after flush, discarding');
								return;
							}
							this._log('play loop callback: decoded frame');
							this._pendingFrame--;
							this._pendingFrames.shift();
							if (ok) {
								// Save the buffer until it's time to draw
								this._decodedFrames.push({
									yCbCrBuffer: this._codec.frameBuffer,
									videoCpuTime: this._codec.videoCpuTime,
									frameEndTimestamp: nextFrameEndTimestamp
								});
							} else {
								// Bad packet or something.
								this._log('Bad video packet or something');
							}
							this._codec.process(() => {
								if (this._isProcessing()) {
									// wait
								} else {
									this._pingProcessing(wasAsync ? undefined : 0);
								}
							});
						});
					});
					if (this._pendingFrame) {
						wasAsync = true;
						this._proxyTime += frameDecodeTime;
						// We can process something else while that's running
						this._pingProcessing();

						if (this._dataEnded) {
							this._codec.sync();
						}
					}

				} else if (readyForAudioDecode) {

					this._log('play loop: ready for audio; depth: ' + this._pendingAudio);

					this._pendingAudio++;
					let nextAudioEndTimestamp = this._codec.audioTimestamp;
					let audioDecodeTime = this._time(() => {
						this._codec.decodeAudio((ok) => {
							this._pendingAudio--;
							this._log('play loop callback: decoded audio');
							this._audioEndTimestamp = nextAudioEndTimestamp;

							if (ok) {
								let buffer = this._codec.audioBuffer;
								if (buffer) {
									// Keep track of how much time we spend queueing audio as well
									// This is slow when using the Flash shim on IE 10/11
									this._bufferTime += this._time(() => {
										if (this._audioFeeder) {
											this._audioFeeder.bufferData(buffer);
										}
									});
									if (!this._codec.hasVideo) {
										this._framesProcessed++; // pretend!
										let frame = {
											frameEndTimestamp: this._audioEndTimestamp
										};
										this._doFrameComplete(frame);
									}
								}
							}
							if (this._isProcessing()) {
								// wait
							} else {
								this._pingProcessing();
							}
						});
					});
					if (this._pendingAudio) {
						this._proxyTime += audioDecodeTime;
						// We can process something else while that's running
						if (this._codec.audioReady) {
							this._pingProcessing();
						} else {
							// Trigger a demux immediately if we need it;
							// audio processing is our mostly-idle time
							this._doProcessPlayDemux();
						}
					}

				} else if (readyForFrameDraw) {

					this._log('play loop: ready to draw frame');

					if (this._nextFrameTimer) {
						clearTimeout(this._nextFrameTimer);
						this._nextFrameTimer = null;
					}

					// Ready to draw the decoded frame...
					if (this._thumbnail) {
						this.removeChild(this._thumbnail);
						this._thumbnail = null;
					}

					let frame = this._decodedFrames.shift();
					this._currentVideoCpuTime = frame.videoCpuTime;

					this._drawingTime += this._time(() => {
						this._drawFrame(frame.yCbCrBuffer);
					});

					this._framesProcessed++;

					this._doFrameComplete(frame);

					this._pingProcessing();

				} else if (this._decodedFrames.length && !this._nextFrameTimer && !this._prebufferingAudio) {

					let targetTimer = frameDelay;
					// @todo consider using requestAnimationFrame
					this._log('play loop: setting a timer for drawing ' + targetTimer);
					this._nextFrameTimer = setTimeout(() => {
						this._nextFrameTimer = null;
						this._pingProcessing();
					}, targetTimer);

				} else if (this._dataEnded && !(this._pendingAudio || this._pendingFrame || this._decodedFrames.length)) {
					this._log('play loop: playback reached end of data ' + [this._pendingAudio, this._pendingFrame, this._decodedFrames.length]);
					let finalDelay = 0;
					if (this._codec.hasAudio && this._audioFeeder) {
						finalDelay = this._audioFeeder.durationBuffered * 1000;
					}
					if (finalDelay > 0) {
						this._log('play loop: ending pending ' + finalDelay + ' ms');
						this._pingProcessing(Math.max(0, finalDelay));
					} else {
						this._log('play loop: ENDING NOW: playback time ' + this._getPlaybackTime() + '; frameEndTimestamp: ' + this._frameEndTimestamp);
						this._stopPlayback();
						this._prebufferingAudio = false;
						this._initialPlaybackOffset = Math.max(this._audioEndTimestamp, this._frameEndTimestamp);
						this._ended = true;
						// @todo implement loop behavior
						this._paused = true;
						this._fireEventAsync('pause');
						this._fireEventAsync('ended');
					}

				} else if (this._prebufferingAudio &&
					((codec.hasVideo && !codec.frameReady) || (codec.hasAudio && !codec.audioReady))
				) {

					this._log('play loop: prebuffering demuxing');

					this._doProcessPlayDemux();

				} else {

					this._log('play loop: waiting on async/timers');

				}

			} else {

				this._log('play loop: demuxing');

				this._doProcessPlayDemux();
			}
		}
	}

	_doProcessPlayDemux() {
		let wasFrameReady = this._codec.frameReady,
			wasAudioReady = this._codec.audioReady;
		this._codec.process((more) => {
			if ((this._codec.frameReady && !wasFrameReady) || (this._codec.audioReady && !wasAudioReady)) {
				this._log('demuxer has packets');
				this._pingProcessing();
			} else if (more) {
				// Have to process some more pages to find data.
				this._log('demuxer processing to find more packets');
				this._pingProcessing();
			} else {
				this._log('demuxer ran out of data');
				if (!this._streamEnded) {
					// Ran out of buffered input
					this._log('demuxer loading more data');
					this._readBytesAndWait();
				} else {
					// Ran out of stream!
					this._log('demuxer reached end of data stream');
					this._dataEnded = true;
					this._pingProcessing();
				}
			}
		});
	}

	_doProcessError() {
		// Nothing to do.
		//console.log("Reached error state. Sorry bout that.");
	}

	/**
	 * Are we waiting on an async operation that will return later?
	 */
	_isProcessing() {
		return (this._stream && (this._stream.buffering || this._stream.seeking))
			|| (this._codec && this._codec.processing);
	}

	_readBytesAndWait() {
		if (this._stream.buffering || this._stream.seeking) {
			this._log('readBytesAndWait during i/o');
			return;
		}
		// keep i/o size small to reduce CPU impact of demuxing on slow machines
		// @todo make buffer size larger when packets are larger?
		const bufferSize = 32768;
		this._stream.read(bufferSize).then((data) => {
			this._log('got input ' + [data.byteLength]);

			if (data.byteLength) {
				// Save chunk to pass into the codec's buffer
				this._actionQueue.push(() => {
					this._codec.receiveInput(data, () => {
						this._pingProcessing();
					});
				});
			}
			if (this._stream.eof) {
				// @todo record doneness in networkState
				this._log('stream is at end!');
				this._streamEnded = true;
			}
			if (this._isProcessing()) {
				// We're waiting on the codec already...
			} else {
				// Let the read/decode/draw loop know we're out!
				this._pingProcessing();
			}
		}).catch((e) => {
			this._onStreamError(e)
		});
	}

	_pingProcessing(delay=-1) {
		if (this._stream && this._stream.waiting) {
			// wait for this input pls
			this._log('waiting on input');
			return;
		}
		if (this._nextProcessingTimer) {
			this._log('canceling old processing timer');
			clearTimeout(this._nextProcessingTimer);
			this._nextProcessingTimer = null;
		}
		let fudge = -1 / 256;
		if (delay > fudge) {
			//this._log('pingProcessing delay: ' + delay);
			this._nextProcessingTimer = setTimeout(() => {
				// run through pingProcessing again to check
				// in case some io started asynchronously in the meantime
				this._pingProcessing();
			}, delay);
		} else if (this._depth) {
			//this._log('pingProcessing tail call (' + delay + ')');
			this._needProcessing = true;
		} else {
			this._doProcessing();
		}
	}

	_startProcessingVideo(firstBuffer) {
		if (this._started || this._codec) {
			return;
		}

		this._framesProcessed = 0;
		this._bufferTime = 0;
		this._drawingTime = 0;
		this._proxyTime = 0;
		this._started = true;
		this._ended = false;

		let codecOptions = {
			// Base to the worker thread, so it can load the codec JS
			base: this._options.base,
			worker: this._enableWorker,
			threading: this._enableThreading,
			wasm: this._enableWASM,
		};
		if (this._options.memoryLimit && !(this._enableWASM)) {
			codecOptions.memoryLimit = this._options.memoryLimit;
		}
		if (this._detectedType) {
			codecOptions.type = this._detectedType;
		}
		this._codec = new OGVWrapperCodec(codecOptions);

		this._lastVideoCpuTime = 0;
		this._lastAudioCpuTime = 0;
		this._lastDemuxerCpuTime = 0;
		this._lastBufferTime = 0;
		this._lastDrawingTime = 0;
		this._lastProxyTime = 0;
		this._lastFrameVideoCpuTime = 0;
		this._lastFrameAudioCpuTime = 0;
		this._lastFrameDemuxerCpuTime = 0;
		this._lastFrameBufferTime = 0;
		this._lastFrameProxyTime = 0;
		this._lastFrameDrawingTime = 0;
		this._currentVideoCpuTime = 0;
		this._codec.onseek = (offset) => {
			this._didSeek = true;
			if (this._stream) {
				this._seekStream(offset);
			}
		};
		this._codec.init(() => {
			this._codec.receiveInput(firstBuffer, () => {
				this._readBytesAndWait()
			});
		});
	}

	_loadCodec(callback) {
		// @todo use the demuxer and codec interfaces directly

		this._stream.read(1024).then((buf) => {
			let hdr = new Uint8Array(buf);
			if (hdr.length > 4 &&
				hdr[0] == 'O'.charCodeAt(0) &&
				hdr[1] == 'g'.charCodeAt(0) &&
				hdr[2] == 'g'.charCodeAt(0) &&
				hdr[3] == 'S'.charCodeAt(0)
			) {
				// Ogg stream
				this._detectedType = 'video/ogg';
			} else if (hdr.length > 4 &&
						hdr[0] == 0x1a &&
						hdr[1] == 0x45 &&
						hdr[2] == 0xdf &&
						hdr[3] == 0xa3
			) {
				// Matroska or WebM
				this._detectedType = 'video/webm';
			} else {
				// @todo handle unknown file types gracefully
				this._detectedType = 'video/ogg';
			}

			// Pass that first buffer in to the demuxer!
			callback(buf);
		});
	}

	_prepForLoad(preload) {
		this._stopVideo();

		let doLoad = () => {
			// @todo networkState == NETWORK_LOADING
			if (this._options.stream) {
				// Allow replacement compatible with the StreamFile interface.
				// This interface may not be fully stable in future, but should
				// help folks doing custom streaming until the MSE interfaces
				// are built up.
				this._stream = this._options.stream;
			} else {
				this._stream = new StreamFile({
					url: this.src,
					cacheSize: 16 * 1024 * 1024,

					// Workaround for https://github.com/brion/ogv.js/issues/514
					// binary string used for progressive downloads can cause
					// data corruption when UTF-16 BOM markers appear at chunk
					// boundaries.
					progressive: false,
				});
			}
			this._stream.load().then(() => {
				this._loading = false;

				// @todo handle failure / unrecognized type

				this._currentSrc = this.src;

				// Fire off the read/decode/draw loop...
				this._byteLength = this._stream.seekable ? this._stream.length : 0;

				// If we get X-Content-Duration, that's as good as an explicit hint
				let durationHeader = this._stream.headers['x-content-duration'];
				if (typeof durationHeader === 'string') {
					this._duration = parseFloat(durationHeader);
				}
				this._loadCodec((buf) => {
					this._startProcessingVideo(buf);
				});
			}).catch((e) => {
				this._onStreamError(e);
			});
		}

		// @todo networkState = this.NETWORK_NO_SOURCE;
		// @todo show poster
		// @todo set 'delay load event flag'

		this._currentSrc = '';
		this._loading = true;
		this._actionQueue.push(() => {
			if (preload && this.preload === 'none') {
				// Done for now, we'll pick up if someone hits play() or load()
				this._loading = false;
			} else {
				doLoad();
			}
		});
		this._pingProcessing(0);
	}

	/**
	 * HTMLMediaElement load method
	 *
	 * https://www.w3.org/TR/html5/embedded-content-0.html#concept-media-load-algorithm
	 */
	load() {
		this._prepForLoad();
	}

	/**
	 * HTMLMediaElement canPlayType method
	 */
	canPlayType(contentType) {
		let type = new OGVMediaType(contentType);
		function checkTypes(supported) {
			if (type.codecs) {
				let knownCodecs = 0,
					unknownCodecs = 0;
				type.codecs.forEach((codec) => {
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
		}
		if (type.minor === 'ogg' &&
			(type.major === 'audio' || type.major === 'video' || type.major === 'application')) {
			return checkTypes(['vorbis', 'opus', 'theora']);
		} else if (type.minor === 'webm' &&
			(type.major === 'audio' || type.major === 'video')) {
			return checkTypes(['vorbis', 'opus', 'vp8', 'vp9']);
		} else {
			return '';
		}
	}

	/**
	 * HTMLMediaElement play method
	 * @fixme return a promise
	 */
	play() {
		if (!this._muted && !this._options.audioContext) {
			OGVPlayer.initSharedAudioContext();
		}

		if (this._paused) {
			this._startedPlaybackInDocument = document.body.contains(this);

			this._paused = false;

			if (this._state == State.SEEKING) {

				// Seeking? Just make sure we know to pick up after.

			} else if (this._started && this._codec && this._codec.loadedMetadata) {

				if (this._ended && this._stream && this._byteLength) {

					this._log('.play() starting over after end');
					this._seek(0);

				} else {
					this._log('.play() while already started');
				}

				this._state = State.READY;
				if (this._isProcessing()) {
					// waiting on the codec already
				} else {
					this._pingProcessing();
				}

			} else if (this._loading) {

				this._log('.play() while loading');

			} else {

				this._log('.play() before started');

				// Let playback begin when metadata loading is complete
				if (!this._stream) {
					this.load();
				}
			}
		}

		if (this._video && this._video.paused) {
			this._video.play();
		}
	}

	/**
	 * custom getPlaybackStats method
	 */
	getPlaybackStats() {
		return {
			targetPerFrameTime: this._targetPerFrameTime,
			framesProcessed: this._framesProcessed,
			videoBytes: this._codec ? this._codec.videoBytes : 0,
			audioBytes: this._codec ? this._codec.audioBytes : 0,
			playTime: this._playTime,
			demuxingTime: this._codec ? (this._codec.demuxerCpuTime - this._lastDemuxerCpuTime) : 0,
			videoDecodingTime: this._codec ? (this._codec.videoCpuTime - this._lastVideoCpuTime) : 0,
			audioDecodingTime: this._codec ? (this._codec.audioCpuTime - this._lastAudioCpuTime) : 0,
			bufferTime: this._bufferTime - this._lastBufferTime,
			drawingTime: this._drawingTime - this._lastDrawingTime,
			proxyTime: this._proxyTime - this._lastProxyTime,
			droppedAudio: this._droppedAudio,
			delayedAudio: this._delayedAudio,
			jitter: this._totalJitter / this._framesProcessed,
			lateFrames: this._lateFrames
		};
	}

	resetPlaybackStats() {
		this._framesProcessed = 0;
		this._playTime = 0;
		if (this._codec) {
			this._lastDemuxerCpuTime = this._codec.demuxerCpuTime;
			this._lastVideoCpuTime = this._codec.videoCpuTime;
			this._lastAudioCpuTime = this._codec.audioCpuTime;
			this._codec.videoBytes = 0;
			this._codec.audioBytes = 0;
		}
		this._lastBufferTime = this._bufferTime;
		this._lastDrawingTime = this._drawingTime;
		this._lastProxyTime = this._proxyTime;
		this._totalJitter = 0;
		this._totalFrameTime = 0;
		this._totalFrameCount = 0;
	}

	getVideoFrameSink() {
		return this._frameSink;
	}

	getCanvas() {
		return this._canvas;
	}

	getVideo() {
		return this._video;
	}

	/**
	 * HTMLMediaElement pause method
	 */
	pause() {
		if (!this._paused) {
			if (this._nextProcessingTimer) {
				clearTimeout(this._nextProcessingTimer);
				this._nextProcessingTimer = null;
			}
			this._stopPlayback();
			this._prebufferingAudio = false;
			this._paused = true;
			this._fireEvent('pause');
		}
	}

	/**
	 * custom 'stop' method
	 */
	stop() {
		this._stopVideo();
		this._paused = true;
	}

	fastSeek(seekToTime) {
		this._seek(+seekToTime, SeekMode.FAST);
	}


}

/**
 * Set up constants on the class and instances
 */
extend(OGVPlayer, constants);

OGVPlayer.instanceCount = 0;

function StyleManager() {
	var self = this;
	var el = document.createElement('style');
	el.type = 'text/css';
	el.textContent = 'ogvjs { ' +
		'display: inline-block; ' +
		'position: relative; ' +
		'-webkit-user-select: none; ' +
		'-webkit-tap-highlight-color: rgba(0,0,0,0); '
		'}';
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
// Also just for fun, IE 10 doesn't support 'auto' sizing on canvas. o_O
OGVPlayer.supportsObjectFit = (typeof document.createElement('canvas').style.objectFit === 'string');
if (OGVPlayer.supportsObjectFit && navigator.userAgent.match(/iPhone|iPad|iPod Touch/)) {
	// Safari for iOS 8/9 supports it but positions our <canvas> incorrectly when using WebGL >:(
	OGVPlayer.supportsObjectFit = false;
}
if (OGVPlayer.supportsObjectFit && navigator.userAgent.match(/Edge/)) {
	// Edge 16 supports it but it doesn't actually work on <canvas>
	OGVPlayer.supportsObjectFit = false;
}
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
		setImmediate(OGVPlayer.updatePositionOnResize);
	};

	window.addEventListener('resize', OGVPlayer.updatePositionOnResize);
	window.addEventListener('orientationchange', OGVPlayer.updatePositionOnResize);

	document.addEventListener('fullscreenchange', fullResizeVideo);
	document.addEventListener('mozfullscreenchange', fullResizeVideo);
	document.addEventListener('webkitfullscreenchange', fullResizeVideo);
	document.addEventListener('MSFullscreenChange', fullResizeVideo);
}

export default OGVPlayer;
