var OGVLoader = require('./OGVLoader.js');

/**
 * Web Worker wrapper for codec fun
 */
function OGVWorkerSupport(propList, handlers) {

	var transferables = (function() {
		var buffer = new ArrayBuffer(1024),
			bytes = new Uint8Array(buffer);
		try {
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
		} catch (e) {
			return false;
		}
	})();

	var self = this;
	self.target = null;

	var sentProps = {},
		pendingEvents = [];

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

	function handleEvent(data) {
		handlers[data.action].call(self, data.args, function(args) {
			args = args || [];

			// Collect and send any changed properties...
			var props = {},
				transfers = [];
			propList.forEach(function(propName) {
				var propVal = self.target[propName];

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
							for (var i = 0; i < propVal.length; i++) {
								transfers.push(propVal[i].buffer);
							}
						}
					} else if (propName == 'frameBuffer') {
						// We already extract ahead of time now,
						// so transfer the small buffers.
						props[propName] = propVal;
						if (propVal) {
							transfers.push(propVal.y.bytes.buffer);
							transfers.push(propVal.u.bytes.buffer);
							transfers.push(propVal.v.bytes.buffer);
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

	handlers.construct = function(args, callback) {
		var className = args[0],
			options = args[1];

		OGVLoader.loadClass(className, function(classObj) {
			classObj(options).then(function(target) {
				self.target = target;
				callback();
				while (pendingEvents.length) {
					handleEvent(pendingEvents.shift());
				}
			});
		});
	};

	addEventListener('message', function workerOnMessage(event) {
		var data = event.data;
		if (!data || typeof data !== 'object') {
			// invalid
			return;
		} else if (data.action == 'transferTest') {
			// ignore
		} else if (typeof data.action !== 'string' || typeof data.callbackId !== 'string' || typeof data.args !== 'object') {
			console.log('invalid message data', data);
		} else if (!(data.action in handlers)) {
			console.log('invalid message action', data.action);
		} else if (data.action == 'construct') {
			// always handle constructor
			handleEvent(data);
		} else if (!self.target) {
			// queue until constructed
			pendingEvents.push(data);
		} else {
			handleEvent(data);
		}
	});

}

module.exports = OGVWorkerSupport;
