/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015
 * @license MIT-style
 */
OGVWorkerCodec = (function(options) {
	options = options || {};
	var self = this,
		suffix = '?version=' + encodeURIComponent(OGVVersion),
		base = (typeof options.base === 'string') ? (options.base + '/') : '',
		type = (typeof options.type === 'string') ? options.type : 'video/ogg',
		worker = new Worker(base + 'ogv-worker.js' + suffix),
		processing = false;

	var transferables = (function() {
		var buffer = new ArrayBuffer(1024),
			bytes = new Uint8Array(buffer);
		worker.postMessage({
			action: 'transferTest',
			bytes: bytes
		}, [buffer]);
		if (buffer.byteLength) {
			// No transferable support
			console.log('no transferable?');
			return false;
		} else {
			console.log('buffers can be transferred');
			return true;
		}
	})();

	var props = {
		loadedMetadata: false,
		duration: NaN,

		hasAudio: false,
		videoFormat: null,
		frameReady: false,
		frameBuffer: null,
		frameTimestamp: 0,
		keyframeTimestamp: 0,

		hasVideo: false,
		audioFormat: null,
		audioReady: false,
		audioBuffer: null,
		audioTimestamp: 0
	};
	for (var iPropName in props) {
		if (props.hasOwnProperty(iPropName)) {
			(function(propName) {
				Object.defineProperty(self, propName, {
					get: function getProperty() {
						return props[propName];
					}
				});
			})(iPropName);
		}
	}
	Object.defineProperty(self, 'processing', {
		get: function() {
			return processing;
		}
	});

	var messageCount = 0,
		pendingCallbacks = {};
	function proxy(action, args, callback, transfers) {
		if (processing) {
			throw new Error('OGVWorkerCodec reentrancy fail: called ' + action + ' while already processing');
		}
		processing = true;

		var callbackId = 'callback-' + (++messageCount) + '-' + action;
		if (callback) {
			pendingCallbacks[callbackId] = callback;
		}
		var out = {
			'action': action,
			'callbackId': callbackId,
			'args': args || []
		};
		if (transferables) {
			worker.postMessage(out, transfers || []);
		} else {
			worker.postMessage(out);
		}
	}

	worker.addEventListener('message', function(event) {
		if (event.data.action !== 'callback') {
			// ignore
			return;
		}
		if (!processing) {
			throw new Error('OGVWorkerCodec reentrancy fail: got callback when not expecting one');
		}
		processing = false;

		var data = event.data,
			callbackId = data.callbackId,
			args = data.args,
			callback = pendingCallbacks[callbackId];

		// Save any updated properties returned to us...
		if (data.props) {
			for (var propName in data.props) {
				if (data.props.hasOwnProperty(propName)) {
					props[propName] = data.props[propName];
				}
			}
		}

		if (callback) {
			delete pendingCallbacks[callbackId];
			callback.apply(this, args);
		}
	});

	// - public methods
	self.init = function() {
		proxy('init', [type, OGVVersion]);
	};

	self.destroy = function() {
		proxy('destroy');
	};

	self.receiveInput = function(data, callback) {
		proxy('receiveInput', [data], callback, [data]);
	};

	self.process = function(callback) {
		proxy('process', [], callback);
	};

	self.decodeFrame = function(callback) {
		proxy('decodeFrame', [], callback);
	};

	self.decodeAudio = function(callback) {
		proxy('decodeAudio', [], callback);
	}

	self.discardFrame = function(callback) {
		proxy('discardFrame', [], callback);
	};

	self.discardAudio = function(callback) {
		proxy('discardAudio', [], callback);
	};

	self.flush = function(callback) {
		proxy('flush', [], callback);
	};

	self.getKeypointOffset = function(timeSeconds, callback) {
		proxy('getKeypointOffset', [timeSeconds], callback);
	};

	return self;
});
