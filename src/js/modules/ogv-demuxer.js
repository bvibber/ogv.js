/* global Module */
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
	var delta = (getTimestamp() - start);
	Module['cpuTime'] += delta;
	//console.log('demux time ' + delta);
	return ret;
}

// - Properties

Module['loadedMetadata'] = false;
Module['videoCodec'] = null;
Module['audioCodec'] = null;
Module['duration'] = NaN;
Module['onseek'] = null;
Module['cpuTime'] = 0;

Module['audioPackets'] = [];
Object.defineProperty(Module, 'hasAudio', {
	get: function() {
		return Module['loadedMetadata'] && Module['audioCodec'];
	}
});
Object.defineProperty(Module, 'audioReady', {
	get: function() {
		return Module['audioPackets'].length > 0;
	}
});
Object.defineProperty(Module, 'audioTimestamp', {
	get: function() {
		if (Module['audioPackets'].length > 0) {
			return Module['audioPackets'][0]['timestamp'];
		} else {
			return -1;
		}
	}
});

Module['videoPackets'] = [];
Object.defineProperty(Module, 'hasVideo', {
	get: function() {
		return Module['loadedMetadata'] && Module['videoCodec'];
	}
});
Object.defineProperty(Module, 'frameReady', {
	get: function() {
		return Module['videoPackets'].length > 0;
	}
});
Object.defineProperty(Module, 'frameTimestamp', {
	get: function() {
		if (Module['videoPackets'].length > 0) {
			return Module['videoPackets'][0]['timestamp'];
		} else {
			return -1;
		}
	}
});
Object.defineProperty(Module, 'keyframeTimestamp', {
	get: function() {
		if (Module['videoPackets'].length > 0) {
			return Module['videoPackets'][0]['keyframeTimestamp'];
		} else {
			return -1;
		}
	}
});
/**
 * If we've seen a future keyframe in the queue, what is it?
 * @property number
 */
Object.defineProperty(Module, 'nextKeyframeTimestamp', {
	get: function() {
		for (var i = 0; i < Module['videoPackets'].length; i++) {
			var packet = Module['videoPackets'][i];
			if (packet['isKeyframe']) {
				return packet['timestamp'];
			}
		}
		return -1;
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

Object.defineProperty(Module, 'seekable', {
	get: function() {
		return !!Module['_ogv_demuxer_seekable']();
	}
});

// - public methods

Module['init'] = function() {
	time(function() {
		Module['_ogv_demuxer_init']();
	});
};

/**
 * Queue up some data for later processing...
 *
 * @param ArrayBuffer data
 */
Module['receiveInput'] = function(data) {
	time(function() {
		// Map the ArrayBuffer into emscripten's runtime heap
		var len = data.byteLength;
		var buffer = reallocInputBuffer(len);
		var dest = new Uint8Array(wasmMemory.buffer, buffer, len);
		dest.set(new Uint8Array(data));
		Module['_ogv_demuxer_receive_input'](buffer, len);
	});
};

/**
 * Process previously queued data into packets.
 *
 * return value is 'true' if there
 * are more packets to be processed in the queued data,
 * or 'false' if there aren't.
 */
Module['process'] = function() {
	var ret = time(function() {
		return Module['_ogv_demuxer_process']();
	});
	return ret;
};

Module['dequeueVideoPacket'] = function() {
	return Module['videoPackets'].shift();
};

Module['dequeueAudioPacket'] = function() {
	return Module['audioPackets'].shift();
};

/**
 * Return the offset of the relevant keyframe or other position
 * just before the given presentation timestamp
 *
 * @param number timeSeconds
 * @return number byte offset
 */
Module['getKeypointOffset'] = function(timeSeconds) {
	var offset = time(function() {
		return Module['_ogv_demuxer_keypoint_offset'](timeSeconds * 1000);
	});
	return offset;
};

/**
 * Initiate seek to the nearest keyframe or other position just before
 * the given presentation timestamp. This may trigger seek requests, and
 * it may take some time before processing returns more packets.
 *
 * @param number timeSeconds
 * @return boolean indicates whether seeking was initiated or not.
 */
Module['seekToKeypoint'] = function(timeSeconds) {
	var ret = time(function() {
		return Module['_ogv_demuxer_seek_to_keypoint'](timeSeconds * 1000);
	});
	if (ret) {
		Module['audioPackets'].splice(0, Module['audioPackets'].length);
		Module['videoPackets'].splice(0, Module['videoPackets'].length);
	}
	return Boolean(ret);
};

Module['flush'] = function() {
	time(function() {
		Module['audioPackets'].splice(0, Module['audioPackets'].length);
		Module['videoPackets'].splice(0, Module['videoPackets'].length);
		Module['_ogv_demuxer_flush']();
	});
};

/**
 * Close out any resources required by the demuxer module
 */
Module['close'] = function() {
	// no-op
};
