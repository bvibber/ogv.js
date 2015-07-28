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

Module.loadedmetadata = false;
Module.videoCodec = null;
Module.audioCodec = null;
Module.duration = NaN;

Module.audioPackets = [];
Object.defineProperty(Module, 'hasAudio', {
	get: function() {
		return Module.loadedMetadata && Module.audioCodec;
	}
});
Object.defineProperty(Module, 'audioReady', {
	get: function() {
		return Module.audioPackets.length > 0;
	}
});
Object.defineProperty(Module, 'audioTimestamp', {
	get: function() {
		if (Module.audioPackets.length > 0) {
			return Module.audioPackets[0].timestamp;
		} else {
			return -1;
		}
	}
});

Module.videoPackets = [];
Object.defineProperty(Module, 'hasVideo', {
	get: function() {
		return Module.loadedMetadata && Module.videoCodec;
	}
});
Object.defineProperty(Module, 'frameReady', {
	get: function() {
		return Module.videoPackets.length > 0;
	}
});
Object.defineProperty(Module, 'frameTimestamp', {
	get: function() {
		if (Module.videoPackets.length > 0) {
			return Module.videoPackets[0].timestamp;
		} else {
			return -1;
		}
	}
});
Object.defineProperty(Module, 'keyframeTimestamp', {
	get: function() {
		if (Module.videoPackets.length > 0) {
			return Module.videoPackets[0].keyframeTimestamp;
		} else {
			return -1;
		}
	}
});

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
	Module._ogv_demuxer_init();
	callback();
}

/**
 * Queue up some data and process into packets...
 *
 * @param ArrayBuffer data
 * @param function callback on completion
 */
Module.process = function(data, callback) {
	// Map the ArrayBuffer into emscripten's runtime heap
	var len = data.byteLength;
	var buffer = reallocInputBuffer(len);
	Module.HEAPU8.set(new Uint8Array(data), buffer);

	var ret = Module._ogv_demuxer_process(buffer, len);
	callback(ret);
};

Module.dequeueVideoPacket = function(callback) {
	if (Module.videoPackets.length) {
		var packet = Module.videoPackets.shift().data;
		callback(packet);
	} else {
		callback(null);
	}
};

Module.dequeueAudioPacket = function(callback) {
	if (Module.audioPackets.length) {
		var packet = Module.audioPackets.shift().data;
		callback(packet);
	} else {
		callback(null);
	}
};

/**
 * Return the offset of the relevant keyframe or other position
 * just before the given presentation timestamp
 *
 * @param number timeSeconds
 * @param function(number) callback
 *        takes the calculated byte offset
 */
Module.getKeypointOffset = function(timeSeconds, callback) {
	var offset = Module._ogv_demuxer_keypoint_offset(timeSeconds * 1000);
	callback(offset);
};

Module.flush = function(callback) {
	Module.audioPackets.splice(0, Module.audioPackets.length);
	Module.videoPackets.splice(0, Module.videoPackets.length);
	Module._ogv_demuxer_flush();
	callback();
};
