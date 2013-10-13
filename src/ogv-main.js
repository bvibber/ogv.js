OgvJs = (function(canvas) {
	var self = this;
    var ctx = canvas.getContext('2d');
    
    var Module = {
    	noInitialRun: true,
    	noExitRuntime: true,
    	print: function(str) {
    		console.log("OgvJs: " + str);
    	}
    };
    //import "../build/intermediate/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', 'void', []);
    var OgvJsDestroy = Module.cwrap('OgvJsDestroy', 'void', []);
    var OgvJsReceiveInput = Module.cwrap('OgvJsReceiveInput', 'void', ['*', 'number']);
    var OgvJsProcess = Module.cwrap('OgvJsProcess', 'int', []);

	var imageData;
	function OgvJsImageData(width, height) {
		if (imageData !== undefined && width == imageData.width && height == imageData.height) {
			// reuse imageData object
		} else {
			console.log("Creating new imageDataobject...");
			imageData = ctx.createImageData(width, height);
		}
		return imageData;
	}
	
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
		console.log('reallocating buffer');
		inputBuffer = Module._malloc(inputBufferSize);
		return inputBuffer;
	}
	
	function OgvJsInitVideoCallback(info) {
		if (self.oninitvideo) {
			self.oninitvideo(info);
		}
	}
	
	var queuedFrame = null;
	function OgvJsFrameCallback(imageData) {
		if (self.frameReady) {
			throw new Error("OgvJsFrameCallback called when frame already queued");
		} else {
			queuedFrame = imageData;
			self.frameReady = true;
		}
	}
	
	function OgvJsInitAudioCallback(info) {
		if (self.oninitaudio) {
			self.oninitaudio(info);
		}
	}

	function OgvJsAudioCallback(audioData) {
		if (self.onaudio) {
			self.onaudio(audioData);
		}
	}

	/**
	 * @property function({codec, frameWidth, frameHeight, fps, picWidth, picHeight, picX, picY}) event handler when initializing video stream
	 */
	self.onvideoinit = null;

	/**
	 * @property function({codec, channels, rate}) event handler when initializing audio stream
	 */
	self.onaudioinit = null;

	/**
	 * @property function(ArrayBuffer audioData) event handler when audio is decoded
	 */
	self.onaudio = null;

	/**
	 * @property boolean Have we decoded a frame that's ready to be used?
	 */
	self.frameReady = false;
	
	/**
	 * Tear down the instance when done.
	 *
	 * todo: do we need to do something more to destroy the C environment?
	 */
	self.destroy = function() {
		if (inputBuffer) {
			Module._free(inputBuffer);
			inputBuffer = undefined;
		}
		OgvJsDestroy();
		console.log("ogv.js destroyed");
	};
	
	/**
	 * Queue up a chunk of input data for later processing.
	 *
	 * @param ArrayBuffer data
	 */
	self.receiveInput = function(data) {
		// Map the blob into a buffer in emscripten's runtime heap
		var len = data.byteLength;
		var buffer = reallocInputBuffer(len);
		Module.HEAPU8.set(new Uint8Array(data), buffer);

		OgvJsReceiveInput(buffer, len);
	};
	
	/**
	 * Process the next packet in the stream
	 *
	 * This may trigger 'onframe' event callbacks after calling.
	 */
	self.process = function() {
		return OgvJsProcess();
	}
	
	/**
	 * Return the last-decoded frame, if any.
	 *
	 * @return ImageData or null
	 */
	self.dequeueFrame = function() {
		if (self.frameReady) {
			var frame = queuedFrame;
			queuedFrame = null;
			self.frameReady = false;
			return frame;
		} else {
			throw new Error("called dequeueFrame when no frame ready");
		}
	}

	OgvJsInit();
	return self;
});
