/* global Module */

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
	Module.cpuTime += delta;
	//console.log('demux time ' + delta);
	return ret;
}

function OGVQueue() {
	this.packets = [];
}
OGVQueue.prototype.clear = function() {
	return this.packets.splice(0, this.packets.length);
}
OGVQueue.prototype.peek = function() {
	return this.packets.length ? this.packets[0] : null;
};
OGVQueue.prototype.next = function() {
	return this.packets.length ? this.packets.shift() : null;
};
OGVQueue.prototype.push = function(packet) {
	this.packets.push(packet);
};

// - Properties

Module.loaded = false;
Module.audio = null;
Module.video = null;
Module.duration = NaN;
Module.cpuTime = 0;

Module.stream = null;
Module.audioPackets = new OGVQueue();
Module.videoPackets = new OGVQueue();
Module.promiseCallbacks = null;

/**
 * Are we in the middle of an asynchronous processing operation?
 * @property boolean
 */
Object.defineProperty(Module, 'processing', {
	get: function getProcessing() {
		return !!Module.promiseCallbacks;
	}
});

Object.defineProperty(Module, 'seekable', {
	get: function() {
		return !!Module._ogv_demuxer_seekable() && Module.stream.eof;
	}
});

Object.defineProperty(Module, 'eof', {
	get: function() {
		return !Module.videoPackets.peek() && !Module.audioPackets.peek() && Module.stream.eof;
	}
});

// - public methods

Module.init = function(stream) {
	return new Promise(function(resolve, reject) {
		if (Module.processing) {
			throw new Error('invalid: async operation in progress');
		}
		Module.stream = stream;
		Module.promiseCallbacks = {
			resolve: resolve,
			reject: reject
		};
		Module._ogv_demuxer_init();
	});
};

/**
 * Process some input data until packets are found
 */
function demux() {
	return new Promise(function(resolve, reject) {
		if (Module.processing) {
			throw new Error('invalid: async operation in progress');
		}
		Module.promiseCallbacks = {
			resolve: resolve,
			reject: reject
		};
		Module._ogv_demuxer_demux();
	});
};

function demuxNextPacket(queue) {
	return new Promise(function(resolve, reject) {
		function check() {
			if (queue.peek()) {
				resolve(queue.next());
			} else if (Module.stream.eof) {
				resolve(null);
			} else {
				next();
			}
		}
		function next() {
			demux().then(complete).catch(reject);
		}
		check();
	});
}


/**
 * Process input data until eof or a video packet is found
 * @return {Promise<OGVPacket>} - resolved packet may be null if eof
 */
Module.demuxVideo = function() {
	return demuxNextPacket(Module.videoPackets);
};

/**
 * Process input data until eof or an audio packet is found
 * @return {Promise<OGVPacket>} - resolved packet may be null if eof
 */
Module.demuxAudio = function() {
	return demuxNextPacket(Module.audioPackets);
};


/**
 * Initiate seek to the nearest keyframe or other position just before
 * the given presentation timestamp. This may trigger seek requests, and
 * it may take some time before processing returns more packets.
 *
 * @param {number} timeSeconds - time in seconds to aim for
 * @returns {Promise}
 */
Module.seek = function(timeSeconds) {
	return new Promise(function(resolve, reject) {
		if (!Module.seekable) {
			throw new Error('invalid: seek on non-seekable data');
		}
		if (Module.processing) {
			throw new Error('invalid: async operation in progress');
		}
		Module.promiseCallbacks = {
			resolve: resolve,
			reject: reject
		};
		Module.audioPackets.clear();
		Module.videoPackets.clear();
		Module._ogv_demuxer_seek(timeSeconds);
	});
};

Module.abort = function() {
	if (Module.processing) {
		// This will send an AbortError through the promises.
		Module.stream.abort();
	}
};

Module.flush = function() {
	return new Promise(function(resolve, reject) {
		if (Module.processing) {
			throw new Error('invalid: async operation in progress');
		}
		time(function() {
			Module.audioPackets.clear();
			Module.videoPackets.clear();
			Module._ogv_demuxer_flush();
		});
		resolve();
	})
};

/**
 * Close out any resources required by the demuxer module
 */
Module.close = function() {
	if (Module.stream) {
		Module.stream.close();
	}
};

Math.imul = Math_imul_orig;
