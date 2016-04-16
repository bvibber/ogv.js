/**
 * @file Web Audio API backend for AudioFeeder
 * @author Brion Vibber <brion@pobox.com>
 * @copyright (c) 2013-2016 Brion Vibber
 * @license MIT
 */

(function() {

  var AudioContext = window.AudioContext || window.webkitAudioContext,
    BufferQueue = require('./buffer-queue.js');

  /**
   * Constructor for AudioFeeder's Web Audio API backend.
   * @class
   * @param {number} numChannels - requested count of output channels
   * @param {number} sampleRate - requested sample rate for output
   * @param {Object} options - pass URL path to directory containing 'dynamicaudio.swf' in 'base' parameter
   *
   * @classdesc Web Audio API output backend for AudioFeeder.
   * Maintains an internal {@link BufferQueue} of audio samples to be output on demand.
   */
  function WebAudioBackend(numChannels, sampleRate, options) {
    var context = options.audioContext || WebAudioBackend.initSharedAudioContext();

    this._context = context;

    /**
     * Actual sample rate supported for output, in Hz
     * @type {number}
     * @readonly
     */
    this.rate = context.sampleRate;

    /**
     * Actual count of channels supported for output
     * @type {number}
     * @readonly
     */
    this.channels = Math.min(numChannels, 2); // @fixme remove this limit

    /**
     * Size of output buffers in samples, as a hint for latency/scheduling
     * @type {number}
     * @readonly
     */
    this.bufferSize = 4096 || (options.bufferSize | 0);

    this._bufferQueue = new BufferQueue(this.channels, this.bufferSize);
    this._playbackTimeAtBufferTail = context.currentTime;
    this._queuedTime = 0;
    this._delayedTime = 0;
    this._dropped = 0;
    this._muted = false;

    // @todo support new audio worker mode too
    if (context.createScriptProcessor) {
      this._node = context.createScriptProcessor(this.bufferSize, 0, this.channels);
    } else if (context.createJavaScriptNode) {
      // In older Safari versions
      this._node = context.createJavaScriptNode(this.bufferSize, 0, this.channels);
    } else {
      throw new Error("Bad version of web audio API?");
    }
  }

  /**
   * onaudioprocess event handler for the ScriptProcessorNode
   * @param {AudioProcessingEvent} event - audio processing event object
   * @access private
   */
  WebAudioBackend.prototype._audioProcess = function(event) {
    var channel, input, output, i, playbackTime;
    if (typeof event.playbackTime === 'number') {
      playbackTime = event.playbackTime;
    } else {
      // Safari 6.1 hack
      playbackTime = this._context.currentTime + (this.bufferSize / this.rate);
    }

    var expectedTime = this._playbackTimeAtBufferTail;
    if (expectedTime < playbackTime) {
      // we may have lost some time while something ran too slow
      this._delayedTime += (playbackTime - expectedTime);
    }

    if (this._bufferQueue.sampleCount() < this.bufferSize) {
      // We might be in a throttled background tab; go ping the decoder
      // and let it know we need more data now!
      // @todo use standard event firing?
      if (this.onstarved) {
        this.onstarved();
      }
    }

    // If we still haven't got enough data, write a buffer of silence
    // to all channels and record an underrun event.
    // @todo go ahead and output the data we _do_ have?
    if (this._bufferQueue.sampleCount() < this.bufferSize) {
      for (channel = 0; channel < this.channels; channel++) {
        output = event.outputBuffer.getChannelData(channel);
        for (i = 0; i < this.bufferSize; i++) {
          output[i] = 0;
        }
      }
      this._dropped++;
      return;
    }

    // @todo adjust volume on a full scale as well as the mute param
    var volume = (this._muted ? 0 : 1);

    // Actually get that data and write it out...
    var inputBuffer = this._bufferQueue.nextBuffer();
    if (inputBuffer[0].length < this.bufferSize) {
      // This should not happen, but trust no invariants!
      throw 'Audio buffer not expected length.';
    }
    for (channel = 0; channel < this.channels; channel++) {
      input = inputBuffer[channel];
      output = event.outputBuffer.getChannelData(channel);
      for (i = 0; i < input.length; i++) {
        output[i] = input[i] * volume;
      }
    }
    this._queuedTime += (this.bufferSize / this.rate);
    this._playbackTimeAtBufferTail = playbackTime + (this.bufferSize / this.rate);
  };


  /**
   * Return a count of samples that have been queued or output but not yet played.
   *
   * @returns {number} - sample count
   * @access private
   */
  WebAudioBackend.prototype._samplesQueued = function() {
    var bufferedSamples = this._bufferQueue.sampleCount();
    var remainingSamples = Math.floor(this._timeAwaitingPlayback() * this.rate);

    return bufferedSamples + remainingSamples;
  };

  /**
   * Return time duration between the present and the endpoint of audio
   * we have already sent out from our queue to Web Audio.
   *
   * @returns {number} - seconds
   */
  WebAudioBackend.prototype._timeAwaitingPlayback = function() {
    return Math.max(0, this._playbackTimeAtBufferTail - this._context.currentTime);
  };

  /**
   * Get info about current playback state.
   *
   * @return {PlaybackState} - info about current playback state
   */
  WebAudioBackend.prototype.getPlaybackState = function() {
    return {
      playbackPosition: this._queuedTime - this._timeAwaitingPlayback(),
      samplesQueued: this._samplesQueued(),
      dropped: this._dropped,
      delayed: this._delayedTime
    };
  };

  /**
   * Wait asynchronously until the backend is ready before continuing.
   *
   * This will always call immediately for the Web Audio API backend,
   * as there is no async setup process.
   *
   * @param {function} callback - to be called when ready
   */
  WebAudioBackend.prototype.waitUntilReady = function(callback) {
    callback();
  };

  /**
   * Append a buffer of audio data to the output queue for playback.
   *
   * Audio data must be at the expected sample rate; resampling is done
   * upstream in {@link AudioFeeder}.
   *
   * @param {SampleBuffer} sampleData - audio data at target sample rate
   */
  WebAudioBackend.prototype.appendBuffer = function(sampleData) {
    this._bufferQueue.appendBuffer(sampleData);
  };

  /**
   * Start playback.
   *
   * Audio should have already been queued at this point,
   * or starvation may occur immediately.
   */
  WebAudioBackend.prototype.start = function() {
    this._node.onaudioprocess = this._audioProcess.bind(this);
    this._node.connect(this._context.destination);
    this._playbackTimeAtBufferTail = this._context.currentTime;
  };

  /**
   * Stop playback, but don't release resources or clear the buffers.
   * We'll probably come back soon.
   */
  WebAudioBackend.prototype.stop = function() {
    if (this._node) {
      this._node.onaudioprocess = null;
      this._node.disconnect();
    }
  };

  /**
   * Close out the playback system and release resources.
   *
   * @todo consider releasing the AudioContext when possible
   */
  WebAudioBackend.prototype.close = function() {
    this.stop();

    this._context = null;
    this._buffers = null;
  };

  /**
   * Set the output to muted.
   */
  WebAudioBackend.prototype.mute = function() {
    this._muted = true;
  };

  /**
   * Set the output to unmuted.
   */
  WebAudioBackend.prototype.unmute = function() {
    this._muted = false;
  };

  /**
   * Check if Web Audio API appears to be supported.
   *
   * Note this is somewhat optimistic; will return true even if there are no
   * audio devices available, as long as the API is present.
   *
   * @returns {boolean} - true if this browser appears to support Web Audio API
   */
  WebAudioBackend.isSupported = function() {
    return !!AudioContext;
  };

  /**
   * Holder of audio context to be used/reused by WebAudioBackend.
   * @see {WebAudioBackend#initSharedAudioContext}
   *
   * @type {AudioContext}
   */
  WebAudioBackend.sharedAudioContext = null;

  /**
	 * Force initialization of the default Web Audio API context.
	 *
	 * Some browsers (such as mobile Safari) disable audio output unless
	 * first triggered from a UI event handler; call this method as a hint
	 * that you will be starting up an AudioFeeder soon but won't have data
	 * for it until a later callback.
   *
   * @returns {AudioContext|null} - initialized AudioContext instance, if applicable
	 */
  WebAudioBackend.initSharedAudioContext = function() {
		if (!WebAudioBackend.sharedAudioContext) {
			if (WebAudioBackend.isSupported()) {
				// We're only allowed 4 contexts on many browsers
				// and there's no way to discard them (!)...
				var context = new AudioContext(),
					node;
				if (context.createScriptProcessor) {
					node = context.createScriptProcessor(1024, 0, 2);
				} else if (context.createJavaScriptNode) {
					node = context.createJavaScriptNode(1024, 0, 2);
				} else {
					throw new Error( "Bad version of web audio API?" );
				}

				// Don't actually run any audio, just start & stop the node
				node.connect(context.destination);
				node.disconnect();

        // So far so good. Keep it around!
        WebAudioBackend.sharedAudioContext = context;
			}
		}
    return WebAudioBackend.sharedAudioContext;
	};

  module.exports = WebAudioBackend;

})();
