/**
 * Web Worker wrapper for codec fun
 */

var transferables = (function() {
	var buffer = new ArrayBuffer(1024),
		bytes = new Uint8Array(buffer);
	postMessage({
		action: 'transferTest',
		bytes: bytes
	}, [buffer]);
	if (buffer.byteLength) {
		// No transferable support
		return false;
	} else {
		return true;
	}
})();

var codec = null;

var propList = [
	'loadedMetadata',
	'duration',

	'hasVideo',
	'videoFormat',
	'frameReady',
	'frameTimestamp',
	'keyframeTimestamp',
	'frameBuffer',

	'hasAudio',
	'audioFormat',
	'audioReady',
	'audioTimestamp',
	'audioBuffer'
];

var sentProps = {};

var handlers = {
	init: function(args, callback) {
		var type = args[0],
			version = args[1],
			suffix = '?version=' + encodeURIComponent(version);
		if (type.match(/^(application|audio|video)\/ogg\b/)) {
			importScripts('ogv-codec.js' + suffix);
			codec = new OGVOggDecoder();
		} else if (type.match(/^(audio|video)\/webm\b/)) {
			importScripts('webm-codec.js' + suffix);
			codec = new OGVWebMDecoder();
		} else {
			throw new Error('Unrecognized codec type request');
		}
		codec.init();
		callback();
	},

	destroy: function(args, callback) {
		codec.destroy();
		callback();
	},

	receiveInput: function(args, callback) {
		codec.receiveInput(args[0], function() {
			callback();
		});
	},
	
	process: function(args, callback) {
		codec.process(function(more) {
			callback([more]);
		});
	},

	decodeFrame: function(args, callback) {
		codec.decodeFrame(function(ok) {
			callback([ok]);
		});
	},

	decodeAudio: function(args, callback) {
		codec.decodeAudio(function(ok) {
			callback([ok]);
		});
	},

	discardFrame: function(args, callback) {
		codec.discardFrame(function() {
			callback();
		});
	},

	discardAudio: function(args, callback) {
		codec.discardAudio(function() {
			callback();
		});
	},

	flush: function(args, callback) {
		codec.flush(function() {
			callback();
		});
	},

	getKeypointOffset: function(args, callback) {
		codec.getKeypointOffset(args[0], function(offset) {
			callback([offset]);
		});
	},
};

function copyObject(obj) {
	var copy = {};
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			copy[prop] = obj[prop];
		}
	}
	return copy;
}

function copyAudioBuffer(data) {
	if (data == null) {
		return null;
	} else {
		// Array of Float32Arrays
		var copy = [];
		for (var i = 0; i < data.length; i++) {
			copy[i] = new Float32Array(data[i]);
		}
		return copy;
	}
}

function copyByteArray(bytes) {
	// Hella slow in IE 10/11!
	//return new Uint8Array(bytes);

	// This claims to be faster in profiling but I don't see it in counters...
	var heap = bytes.buffer,
		extract = heap.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
		copy = new Uint8Array(extract);
	return copy;
}

function copyFrameBuffer(buffer) {
	if (buffer == null) {
		return null;
	} else {
		var copy = copyObject(buffer);
		copy.bytesY = copyByteArray(buffer.bytesY);
		copy.bytesCb = copyByteArray(buffer.bytesCb);
		copy.bytesCr = copyByteArray(buffer.bytesCr);
		return copy;
	}
}

addEventListener('message', function(event) {
	var data = event.data;
	
	if (data && data.action == 'transferTest') {
		// ignore
		return;
	}

	if (typeof data !== 'object' || typeof data.action !== 'string' || typeof data.callbackId !== 'string' || typeof data.args !== 'object') {
		console.log('invalid message data', data);
	} else if (!(data.action in handlers)) {
		console.log('invalid message action', data.action);
	} else {
		handlers[data.action](data.args, function(args) {
			args = args || [];

			// Collect and send any changed properties...
			var props = {},
				transfers = [];
			propList.forEach(function(propName) {
				var propVal = codec[propName];

				if (sentProps[propName] !== propVal) {
					// Save this value for later reference...
					sentProps[propName] = propVal;

					if (propName == 'duration' && isNaN(propVal) && isNaN(sentProps[propName])) {
						// NaN is not === itself. Nice!
						// no need to update it here.
					} else if (propName == 'audioBuffer') {
						// Don't send the entire emscripten heap!
						propVal = copyAudioBuffer(propVal);
						props[propName] = propVal;
						if (propVal) {
							for (i = 0; i < propVal.length; i++) {
								transfers.push(propVal[i].buffer);
							}
						}
					} else if (propName == 'frameBuffer') {
						// Don't send the entire emscripten heap!
						propVal = copyFrameBuffer(propVal);
						props[propName] = propVal;
						if (propVal) {
							transfers.push(propVal.bytesY.buffer);
							transfers.push(propVal.bytesCb.buffer);
							transfers.push(propVal.bytesCr.buffer);
						}
					} else {
						props[propName] = propVal;
					}
				}
			});

			var out = {
				action: 'callback',
				callbackId: data.callbackId,
				args: args,
				props: props
			};
			if (transferables) {
				postMessage(out, transfers);
			} else {
				postMessage(out);
			}
		});
	}
});
