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
Module.loadedMetadata = false;

/**
 * @property object
 */
Module.videoFormat = null;

/**
 * Last-decoded video packet
 * @property object
 */
Module.frameBuffer = null;

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

	var ret = Module._ogv_video_decoder_process_header(buffer, len);

	callback(ret);
};

/**
 * Decode the given video data packet; fills out the frameBuffer property on success
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module.processFrame = function(data, callback) {
	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = reallocInputBuffer(len);
	Module.HEAPU8.set(new Uint8Array(data), buffer);

	var ret = Module._ogv_video_decoder_process_frame(buffer, len)

	callback(ret);
};

Module._ogv_video_decoder_init();
