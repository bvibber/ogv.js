OgvJs = (function(options) {
	options = options || {};
	var self = this,
		processAudio = (options.audio !== undefined) ? !!options.audio : true,
		processVideo = (options.video !== undefined) ? !!options.video : true;
    
    var Module = {
    	noInitialRun: true,
    	noExitRuntime: true,
    	TOTAL_MEMORY: 32 * 1024 * 1024, // default heap is 16M
    	print: function(str) {
    		console.log("OgvJs: " + str);
    	}
    };
    //import "../build/intermediate/ogv-libs.js"
    
    var OgvJsInit = Module.cwrap('OgvJsInit', 'void', ['number', 'number']);
    var OgvJsDestroy = Module.cwrap('OgvJsDestroy', 'void', []);
    var OgvJsReceiveInput = Module.cwrap('OgvJsReceiveInput', 'void', ['*', 'number']);
    var OgvJsProcess = Module.cwrap('OgvJsProcess', 'int', ['number', 'number']);

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
		self.hasVideo = true;
		if (self.oninitvideo) {
			self.oninitvideo(info);
		}
	}
	
	var queuedFrame = null;
	function OgvJsFrameCallback(frameBuffer) {
		if (self.frameReady) {
			throw new Error("OgvJsFrameCallback called when frame already queued");
		} else {
			queuedFrame = frameBuffer;
			self.frameReady = true;
		}
	}
	
	function OgvJsInitAudioCallback(info) {
		self.hasAudio = true;
		if (self.oninitaudio) {
			self.oninitaudio(info);
		}
	}

	var audioBuffers = [];
	function OgvJsAudioCallback(audioData) {
		audioBuffers.push(audioData);
		self.audioReady = true;
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
	 * @property boolean does the media stream contain video?
	 */
	self.hasVideo = false;

	/**
	 * @property boolean does the media stream contain audio?
	 */
	self.hasAudio = false;

	/**
	 * @property boolean Have we decoded a frame that's ready to be used?
	 */
	self.frameReady = false;
	
	/**
	 * @property boolean Have we decoded an audio buffer that's ready to be used?
	 */
	self.audioReady = false;
	
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
	 */
	self.process = function(audioPosition, audioReady) {
		return OgvJsProcess(audioPosition, audioReady ? 1 : 0);
	}
	
	/**
	 * Return the last-decoded frame, if any.
	 *
	 * @return ImageData
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

	/**
	 * Return the next decoded audio buffer
	 *
	 * @return array of audio thingies
	 */
	self.dequeueAudio = function() {
		if (self.audioReady) {
			var buffer = audioBuffers.shift();
			self.audioReady = (audioBuffers.length > 0);
			return buffer;
		} else {
			throw new Error("called dequeueAudio when no audio ready");
		}
	}

	/**
	 * Is there processed data to handle?
	 *
	 * @return boolean
	 */	
	self.dataReady = function() {
		if (self.hasVideo) {
			return self.frameReady;
		} else {
			return self.audioReady;
		}
	}

	OgvJsInit(processAudio ? 1 : 0, processVideo ? 1 : 0);
	return self;
});
