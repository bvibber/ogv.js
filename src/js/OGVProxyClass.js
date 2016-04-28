/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015
 * @license MIT-style
 */
function OGVProxyClass(initialProps, methods) {
	return function(worker, className, options) {
		options = options || {};
		var self = this;

		var transferables = (function() {
			var buffer = new ArrayBuffer(1024),
				bytes = new Uint8Array(buffer);
			try {
				worker.postMessage({
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

		// Set up proxied property getters
		var props = {};
		for (var iPropName in initialProps) {
			if (initialProps.hasOwnProperty(iPropName)) {
				(function(propName) {
					props[propName] = initialProps[propName];
					Object.defineProperty(self, propName, {
						get: function getProperty() {
							return props[propName];
						}
					});
				})(iPropName);
			}
		}

		// Current player wants to avoid async confusion.
		var processingQueue = 0;
		Object.defineProperty(self, 'processing', {
			get: function() {
				return (processingQueue > 0);
			}
		});

		// Set up proxied methods
		for (var method in methods) {
			if (methods.hasOwnProperty(method)) {
				self[method] = methods[method];
			}
		}

		// And some infrastructure!
		var messageCount = 0,
			pendingCallbacks = {};
		this.proxy = function(action, args, callback, transfers) {
			if (!worker) {
				throw 'Tried to call "' + action + '" method on closed proxy object';
			}
			var callbackId = 'callback-' + (++messageCount) + '-' + action;
			if (callback) {
				pendingCallbacks[callbackId] = callback;
			}
			var out = {
				'action': action,
				'callbackId': callbackId,
				'args': args || []
			};
			processingQueue++;
			if (transferables) {
				worker.postMessage(out, transfers || []);
			} else {
				worker.postMessage(out);
			}
		};
		this.terminate = function() {
			if (worker) {
				worker.terminate();
				worker = null;
				processingQueue = 0;
				pendingCallbacks = {};
			}
		};

		worker.addEventListener('message', function proxyOnMessage(event) {
			processingQueue--;
			if (event.data.action !== 'callback') {
				// ignore
				return;
			}

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

		// Tell the proxy to load and initialize the appropriate class
		self.proxy('construct', [className, options], function() {});

		return self;
	};
}

module.exports = OGVProxyClass;