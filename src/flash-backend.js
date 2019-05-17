(function() {

  /* global ActiveXObject */
  var dynamicaudio_swf = require('file?name=[name].[ext]?version=[hash]!../assets/dynamicaudio.swf');

  var nextTick = require('./next-tick-browser.js');

  /**
   * Constructor for AudioFeeder's Flash audio backend.
   * @class
   * @param {number} numChannels - requested count of output channels (actual will be fixed at 2)
   * @param {number} sampleRate - requested sample rate for output (actual will be fixed at 44.1 kHz)
   * @param {Object} options - pass URL path to directory containing 'dynamicaudio.swf' in 'base' parameter
   *
   * @classdesc Flash audio output backend for AudioFeeder.
   * Maintains a local queue of data to be sent down to the Flash shim.
   * Resampling to stereo 44.1 kHz is done upstream in AudioFeeder.
   */
  var FlashBackend = function(numChannels, sampleRate, options) {
    options = options || {};
    var flashOptions = {};
    if (typeof options.base === 'string') {
      // @fixme replace the version string with an auto-updateable one
      flashOptions.swf = options.base + '/' + dynamicaudio_swf;
    }
    if (options.bufferSize) {
      this.bufferSize = (options.bufferSize | 0);
    }

    this._flashaudio = new DynamicAudio(flashOptions);
    this._flashBuffer = '';
    this._cachedFlashState = null;
    this._cachedFlashTime = 0;
    this._cachedFlashInterval = 185; // resync state no more often than every X ms

    this._waitUntilReadyQueue = [];
    this.onready = function() {
        this._flashaudio.flashElement.setBufferSize(this.bufferSize);
        this._flashaudio.flashElement.setBufferThreshold(this.bufferThreshold);
        while (this._waitUntilReadyQueue.length) {
            var callback = this._waitUntilReadyQueue.shift();
            callback.apply(this);
        }
    };
    this.onlog = function(msg) {
        console.log('AudioFeeder FlashBackend: ' + msg);
    }

    this.bufferThreshold = this.bufferSize * 2;

    var events = {
        'ready': 'sync',
        'log': 'sync',
        'starved': 'sync',
        'bufferlow': 'async'
    };
    this._callbackName = 'AudioFeederFlashBackendCallback' + this._flashaudio.id;
    var self = this;
    window[this._callbackName] = (function(eventName) {
        var method = events[eventName],
            callback = this['on' + eventName];
        if (method && callback) {
            if (method === 'async') {
                nextTick(callback.bind(this));
            } else {
                callback.apply(this, Array.prototype.slice.call(arguments, 1));
                this._flushFlashBuffer();
            }
        }
    }).bind(this);
  };

  /**
   * Actual sample rate supported for output, in Hz
   * Fixed to 44.1 kHz for Flash backend.
   * @type {number}
   * @readonly
   */
  FlashBackend.prototype.rate = 44100;

  /**
   * Actual count of channels supported for output
   * Fixed to stereo for Flash backend.
   * @type {number}
   * @readonly
   */
  FlashBackend.prototype.channels = 2;

  /**
   * Buffer size hint.
   * @type {number}
   * @readonly
   */
  FlashBackend.prototype.bufferSize = 4096;

  /**
   * Internal bufferThreshold property backing.
   * @type {number}
   * @access private
   */
  FlashBackend.prototype._bufferThreshold = 8192;

  /**
   * Remaining sample count at which a 'bufferlow' event will be triggered.
   *
   * Will be pinged when falling below bufferThreshold or bufferSize,
   * whichever is larger.
   *
   * @type {number}
   */
  Object.defineProperty(FlashBackend.prototype, 'bufferThreshold', {
    get: function getBufferThreshold() {
      return this._bufferThreshold;
    },
    set: function setBufferThreshold(val) {
      this._bufferThreshold = val | 0;
      this.waitUntilReady((function() {
        this._flashaudio.flashElement.setBufferThreshold(this._bufferThreshold);
      }).bind(this));
    }
  });

  /**
   * Internal volume property backing.
   * @type {number}
   * @access private
   */
  FlashBackend.prototype._volume = 1;

  /**
	 * Volume multiplier, defaults to 1.0.
	 * @name volume
	 * @type {number}
	 */
	Object.defineProperty(FlashBackend.prototype, 'volume', {
		get: function getVolume() {
      return this._volume;
		},
		set: function setVolume(val) {
      this._volume = +val;
      this.waitUntilReady(this._flashVolumeUpdate.bind(this));
		}
	});

  /**
   * Internal muted property backing.
   * @type {number}
   * @access private
   */
  FlashBackend.prototype._muted = false;

  /**
	 * Is the backend currently set to mute output?
	 * When muted, this overrides the volume property.
	 *
	 * @type {boolean}
	 */
	Object.defineProperty(FlashBackend.prototype, 'muted', {
 		get: function getMuted() {
      return this._muted;
 		},
 		set: function setMuted(val) {
      this._muted = !!val;
      this.waitUntilReady(this._flashVolumeUpdate.bind(this));
 		}
 	});

  /**
   * Are we paused/idle?
   * @type {boolean}
   * @access private
   */
  FlashBackend.prototype._paused = true;

  /**
   * Pass the currently configured muted+volume state down to the Flash plugin
   * @access private
   */
  FlashBackend.prototype._flashVolumeUpdate = function() {
    if (this._flashaudio && this._flashaudio.flashElement && this._flashaudio.flashElement.setVolume) {
      this._flashaudio.flashElement.setVolume(this.muted ? 0 : this.volume);
    }
  }

  /**
   * Reordering of output for the Flash fallback.
   * Input data must be pre-resampled to the correct sample rate.
   * Mono input is doubled to stereo; more than 2 channels are dropped.
   *
   * @param {SampleBuffer} samples - input data as separate channels of 32-bit float
   * @returns {Float32Array} - interleaved stereo 32-bit float output
   * @access private
   *
   * @todo handle input with higher channel counts better
   */
  FlashBackend.prototype._resampleFlash = function(samples) {
  	var samplecount = samples[0].length;
  	var newSamples = new Float32Array(samplecount * 2);
  	var chanLeft = samples[0];
  	var chanRight = this.channels > 1 ? samples[1] : chanLeft;
  	for(var s = 0; s < samplecount; s++) {
  		var idx = s;
  		var idx_out = s * 2;

  		newSamples[idx_out] = chanLeft[idx];
  		newSamples[idx_out + 1] = chanRight[idx];
  	}
  	return newSamples;
  };

  var binBytes = [];
  for (var i = 0; i < 256; i++) {
    binBytes[i] = String.fromCharCode(i + 0xe000);
  }
  function binaryString(buffer) {
    var samples = new Uint8Array(buffer);
    var len = samples.length;
    var str = '';
    for (var i = 0; i < len; i += 8) {
      str += binBytes[samples[i]];
      str += binBytes[samples[i + 1]];
      str += binBytes[samples[i + 2]];
      str += binBytes[samples[i + 3]];
      str += binBytes[samples[i + 4]];
      str += binBytes[samples[i + 5]];
      str += binBytes[samples[i + 6]];
      str += binBytes[samples[i + 7]];
    }
    return str;
  }

  /**
   * Send any pending data off to the Flash plugin.
   *
   * @access private
   */
  FlashBackend.prototype._flushFlashBuffer = function() {
    var chunk = this._flashBuffer,
      flashElement = this._flashaudio.flashElement;

    this._flashBuffer = '';

    if (chunk.length > 0) {
      this._cachedFlashState = flashElement.write(chunk);
      this._cachedFlashTime = Date.now();
    }
  };

  /**
   * Append a buffer of audio data to the output queue for playback.
   *
   * Audio data must be at the expected sample rate; resampling is done
   * upstream in {@link AudioFeeder}.
   *
   * @param {SampleBuffer} sampleData - audio data at target sample rate
   */
  FlashBackend.prototype.appendBuffer = function(sampleData) {
    var resamples = this._resampleFlash(sampleData);
    if (resamples.length > 0) {
      var str = binaryString(resamples.buffer);
      this._flashBuffer += str;
      if (this._flashBuffer.length >= this.bufferSize * 8) {
        // consolidate multiple consecutive tiny buffers in one pass;
        // pushing data to Flash is relatively expensive on slow machines
        this._flushFlashBuffer();
      }
    }
  };

  /**
   * Get info about current playback state.
   *
   * @return {PlaybackState} - info about current playback state
   */
  FlashBackend.prototype.getPlaybackState = function() {
    if (this._flashaudio && this._flashaudio.flashElement && this._flashaudio.flashElement.write) {
      var now = Date.now(),
        delta = this._paused ? 0 : (now - this._cachedFlashTime),
        state;
      if (this._cachedFlashState && delta < this._cachedFlashInterval) {
        var cachedFlashState = this._cachedFlashState;
        state = {
          playbackPosition: cachedFlashState.playbackPosition + delta / 1000,
          samplesQueued: cachedFlashState.samplesQueued -
            Math.max(0, Math.round(delta * this.rate / 1000)),
          dropped: cachedFlashState.dropped,
          delayed: cachedFlashState.delayed
        };
      } else {
        state = this._flashaudio.flashElement.getPlaybackState();
        this._cachedFlashState = state;
        this._cachedFlashTime = now;
      }
      state.samplesQueued += this._flashBuffer.length / 8;
      return state;
    } else {
      //console.log('getPlaybackState USED TOO EARLY');
      return {
        playbackPosition: 0,
        samplesQueued: 0,
        dropped: 0,
        delayed: 0
      };
    }
  };

  /**
   * Wait until the backend is ready to start, then call the callback.
   *
   * @param {function} callback - called on completion
   * @todo handle fail case better?
   */
  FlashBackend.prototype.waitUntilReady = function(callback) {
    if (this._flashaudio && this._flashaudio.flashElement.write) {
      callback.apply(this);
    } else {
      this._waitUntilReadyQueue.push(callback);
    }
  };

  /**
   * Start playback.
   *
   * Audio should have already been queued at this point,
   * or starvation may occur immediately.
   */
  FlashBackend.prototype.start = function() {
    this._flushFlashBuffer();
    this._flashaudio.flashElement.start();
    this._paused = false;
    this._cachedFlashState = null;
  };

  /**
   * Stop playback, but don't release resources or clear the buffers.
   * We'll probably come back soon.
   */
  FlashBackend.prototype.stop = function() {
    this._flashaudio.flashElement.stop();
    this._paused = true;
    this._cachedFlashState = null;
  };

  /**
   * Flush any queued data out of the system.
   */
  FlashBackend.prototype.flush = function() {
    this._flashBuffer = '';
    this._flashaudio.flashElement.flush();
    this._cachedFlashState = null;
  };

  /**
   * Close out the playback system and release resources.
   */
  FlashBackend.prototype.close = function() {
    this.stop();

    var wrapper = this._flashaudio.flashWrapper;
    wrapper.parentNode.removeChild(wrapper);
    this._flashaudio = null;
    delete window[this._callbackName];
  };

  /**
   * Synchronous callback for when we run out of input data
   *
   * @type function|null
   */
  FlashBackend.prototype.onstarved = null;

  /**
   * Asynchronous callback for when the buffer runs low and
   * should be refilled soon.
   *
   * @type function|null
   */
  FlashBackend.prototype.onbufferlow = null;

  /**
   * Check if the browser appears to support Flash.
   *
   * Note this is somewhat optimistic, in that Flash may be supported
   * but the dynamicaudio.swf file might not load, or it might load
   * but there might be no audio devices, etc.
   *
   * Currently only checks for the ActiveX Flash plugin for Internet Explorer,
   * as other target browsers support Web Audio API.
   *
   * @returns {boolean} - true if this browser appears to support Flash
   */
  FlashBackend.isSupported = function() {
		if (navigator.userAgent.indexOf('Trident') !== -1) {
			// We only do the ActiveX test because we only need Flash in
			// Internet Explorer 10/11. Other browsers use Web Audio directly
			// (Edge, Safari) or native playback, so there's no need to test
			// other ways of loading Flash.
			try {
				var obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				return true;
			} catch(e) {
				return false;
			}
		}
		return false;
  };

	/** Flash fallback **/

	/*
	The Flash fallback is based on https://github.com/an146/dynamicaudio.js

	This is the contents of the LICENSE file:

	Copyright (c) 2010, Ben Firshman
	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	 * Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer.
	 * Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution.
	 * The names of its contributors may not be used to endorse or promote products
	   derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
	ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/


  /**
   * Wrapper class for instantiating Flash plugin.
   *
   * @constructor
   * @param {Object} opt - pass 'swf' to override default dynamicaudio.swf URL
   * @access private
   */
	function DynamicAudio(opt) {
		this.init(opt);
	}


	DynamicAudio.nextId = 1;

	DynamicAudio.prototype = {
		nextId: null,
		swf: dynamicaudio_swf,

		flashWrapper: null,
		flashElement: null,

		init: function(opts) {
			var self = this;
			self.id = DynamicAudio.nextId++;

			if (opts && typeof opts.swf !== 'undefined') {
				self.swf = opts.swf;
			}


			self.flashWrapper = document.createElement('div');
			self.flashWrapper.id = 'dynamicaudio-flashwrapper-'+self.id;
			// Credit to SoundManager2 for this:
			var s = self.flashWrapper.style;
			s.position = 'fixed';
			s.width = '11px'; // must be at least 6px for flash to run fast
			s.height = '11px';
			s.bottom = s.left = '0px';
			s.overflow = 'hidden';
			self.flashElement = document.createElement('div');
			self.flashElement.id = 'dynamicaudio-flashelement-'+self.id;
			self.flashWrapper.appendChild(self.flashElement);

			document.body.appendChild(self.flashWrapper);

			var id = self.flashElement.id;
            var params = '<param name="FlashVars" value="objectId=' + self.id + '">';

			self.flashWrapper.innerHTML = "<object id='"+id+"' width='10' height='10' type='application/x-shockwave-flash' data='"+self.swf+"' style='visibility: visible;'><param name='allowscriptaccess' value='always'>" + params + "</object>";
			self.flashElement = document.getElementById(id);
		},
	};

  module.exports = FlashBackend;

})();
