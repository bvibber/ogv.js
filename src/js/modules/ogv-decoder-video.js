/* global Module */
/* global options */

// Resizable input buffer to store input packets

var inputBuffer, inputBufferSize;
function reallocInputBuffer(size) {
	if (inputBuffer && inputBufferSize >= size) {
		// We're cool
		return inputBuffer;
	}
	if (inputBuffer) {
		Module._free(inputBuffer);
	}
	inputBufferSize = size;
	inputBuffer = Module._malloc(inputBufferSize);
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
	Module.cpuTime += (getTimestamp() - start);
	return ret;
}

function copyByteArray(bytes) {
	var heap = bytes.buffer;
	if (heap instanceof ArrayBuffer && typeof heap.slice === 'function') {
		var extract = heap.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
		return new Uint8Array(extract);
	} else {
		// Hella slow in IE 10/11!
		// But only game in town on IE 10.
		return new Uint8Array(bytes);
	}
}

// - Properties

/**
 * @property boolean
 */
Module.loadedMetadata = !!options.videoFormat;

/**
 * @property object
 */
Module.videoFormat = options.videoFormat || null;

/**
 * Last-decoded video packet
 * @property object
 */
Module.frameBuffer = null;

/**
 * Running tally of CPU time spent in the decoder.
 * @property number
 */
Module.cpuTime = 0;

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

Module.init = function(callback) {
	time(function() {
		Module._ogv_video_decoder_init();
	});
	callback();
};

/**
 * Process a header packet
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module.processHeader = function(data, callback) {
	var ret = time(function() {
		// Map the ArrayBuffer into emscripten's runtime heap
		var len = data.byteLength;
		var buffer = reallocInputBuffer(len);
		Module.HEAPU8.set(new Uint8Array(data), buffer);

		return Module._ogv_video_decoder_process_header(buffer, len);
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
Module.processFrame = function(data, callback) {
	var isAsync = Module._ogv_video_decoder_async();

	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = Module._malloc(len);
	function callbackWrapper(ret) {
		Module._free(buffer);
		callback(ret);
	}
	if (isAsync) {
		Module.callbacks.push(callbackWrapper);
	}

	var ret = time(function() {
		Module.HEAPU8.set(new Uint8Array(data), buffer);
		return Module._ogv_video_decoder_process_frame(buffer, len)
	});
	if (!isAsync) {
		callbackWrapper(ret);
	}
};

/**
 * Close out any resources required by the decoder module
 */
Module.close = function() {
	// no-op
};

Math.imul = Math_imul_orig;
