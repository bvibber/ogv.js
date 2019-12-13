/* global Module */
/* global options */
/* global ArrayBuffer */
/* global wasmMemory */

// Resizable input buffer to store input packets

var inputBuffer, inputBufferSize;
function reallocInputBuffer(size) {
	if (inputBuffer && inputBufferSize >= size) {
		// We're cool
		return inputBuffer;
	}
	if (inputBuffer) {
		Module['_free'](inputBuffer);
	}
	inputBufferSize = size;
	inputBuffer = Module['_malloc'](inputBufferSize);
	return inputBuffer;
}

var getTimestamp;
if (typeof performance === 'undefined' || typeof performance.now === 'undefined') {
	getTimestamp = Date.now;
} else {
	getTimestamp = performance.now.bind(performance);
}
function time(func) {
	var start = getTimestamp(),
		ret;
	ret = func();
	Module['cpuTime'] += (getTimestamp() - start);
	return ret;
}

// - Properties

/**
 * @property boolean
 */
Module['loadedMetadata'] = !!options['videoFormat'];

/**
 * @property object
 */
Module['videoFormat'] = options['videoFormat'] || null;

/**
 * Last-decoded video packet
 * @property object
 */
Module['frameBuffer'] = null;

/**
 * Running tally of CPU time spent in the decoder.
 * @property number
 */
Module['cpuTime'] = 0;

/**
 * Are we in the middle of an asynchronous processing operation?
 * @property boolean
 */
Object.defineProperty(Module, 'processing', {
	get: function getProcessing() {
		return false;
	}
});

// - public methods

Module['init'] = function(callback) {
	time(function() {
		Module['_ogv_video_decoder_init']();
	});
	callback();
};

/**
 * Process a header packet
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module['processHeader'] = function(data, callback) {
	var ret = time(function() {
		// Map the ArrayBuffer into emscripten's runtime heap
		var len = data.byteLength;
		var buffer = reallocInputBuffer(len);
		var dest = new Uint8Array(wasmMemory.buffer, buffer, len);
		dest.set(new Uint8Array(data));

		return Module['_ogv_video_decoder_process_header'](buffer, len);
	});
	callback(ret);
};

Module.callbacks = [];

/**
 * Decode the given video data packet; fills out the frameBuffer property on success
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module['processFrame'] = function(data, callback) {
	var isAsync = Module['_ogv_video_decoder_async']();

	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = Module['_malloc'](len);
	function callbackWrapper(ret) {
		Module['_free'](buffer);
		callback(ret);
	}
	if (isAsync) {
		Module.callbacks.push(callbackWrapper);
	}

	var ret = time(function() {
		var dest = new Uint8Array(wasmMemory.buffer, buffer, len);
		dest.set(new Uint8Array(data));
		return Module['_ogv_video_decoder_process_frame'](buffer, len)
	});
	if (!isAsync) {
		callbackWrapper(ret);
	}
};

/**
 * Close out any resources required by the decoder module
 */
Module['close'] = function() {
	// no-op
};

/**
 * Force an async decoder to flush any decoded frames out,
 * without losing any state.
 */
Module['sync'] = function() {
	var isAsync = Module['_ogv_video_decoder_async']();
	if (isAsync) {
		Module.callbacks.push(function() {
			// no-op
		});
		time(function() {
			Module['_ogv_video_decoder_process_frame'](0, 0)
		});
	}
};

Module['recycledFrames'] = [];

/**
 * Recycle a YUVBuffer object for later use.
 * @param YUVBuffer frame
 */
Module['recycleFrame'] = function(frame) {
	var arr = Module['recycledFrames'];
	arr.push(frame);
	if (arr.length > 16) {
		arr.shift();
	}
};

// We need to check for IE's rendering engine because of its
// terrible TypedArray 'set' method performance.
var trident = typeof navigator === 'object' && navigator.userAgent.match(/Trident/);
