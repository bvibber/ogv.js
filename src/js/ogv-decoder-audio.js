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

// - Properties

/**
 * @property boolean
 */
Module.loadedMetadata = !!options.audioFormat;

/**
 * @property object
 */
Module.audioFormat = options.audioFormat || null;

/**
 * Last-decoded audio packet
 * @property object
 */
Module.audioBuffer = null;

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
	Module._ogv_audio_decoder_init();
	callback();
};

/**
 * Process a header packet
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module.processHeader = function(data, callback) {
	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = reallocInputBuffer(len);
	Module.HEAPU8.set(new Uint8Array(data), buffer);

	var ret = Module._ogv_audio_decoder_process_header(buffer, len);

	callback(ret);
};

/**
 * Decode the given audio data packet; fills out the audioBuffer property on success
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module.processAudio = function(data, callback) {
	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = reallocInputBuffer(len);
	Module.HEAPU8.set(new Uint8Array(data), buffer);

	var ret = Module._ogv_audio_decoder_process_audio(buffer, len)

	callback(ret);
};
