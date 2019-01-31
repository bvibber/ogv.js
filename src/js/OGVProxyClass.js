/* global ArrayBuffer */

/**
 * Proxy object for web worker interface for codec classes.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2015-2019 Brion Vibber
 * @license MIT-style
 */
function OGVProxyClass(initialProps) {
	return class {
		constructor(worker, className, options) {
			options = options || {};
			this.worker = worker;

			this.transferables = (function() {
				let buffer = new ArrayBuffer(1024),
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

			// Set up proxied properties
			for (let propName in initialProps) {
				if (initialProps.hasOwnProperty(propName)) {
					this[propName] = initialProps[propName];
				}
			}

			// Current player wants to avoid async confusion.
			this.processingQueue = 0;
			Object.defineProperty(this, 'processing', {
				get: function() {
					return (this.processingQueue > 0);
				}
			});

			// And some infrastructure!
			this.messageCount = 0;
			this.pendingCallbacks = {};

			this.worker.addEventListener('message', (event) => {
				this.handleMessage(event);
			});

			// Tell the proxy to load and initialize the appropriate class
			this.proxy('construct', [className, options], () => {});
		}

		proxy(action, args, callback, transfers=[]) {
			if (!this.worker) {
				throw 'Tried to call "' + action + '" method on closed proxy object';
			}
			let callbackId = 'callback-' + (++this.messageCount) + '-' + action;
			if (callback) {
				this.pendingCallbacks[callbackId] = callback;
			}
			let out = {
				'action': action,
				'callbackId': callbackId,
				'args': args || []
			};
			this.processingQueue++;
			if (this.transferables) {
				this.worker.postMessage(out, transfers);
			} else {
				this.worker.postMessage(out);
			}
		}

		terminate() {
			if (this.worker) {
				this.worker.terminate();
				this.worker = null;
				this.processingQueue = 0;
				this.pendingCallbacks = {};
			}
		}

		handleMessage(event) {
			this.processingQueue--;
			if (event.data.action !== 'callback') {
				// ignore
				return;
			}

			let data = event.data,
				callbackId = data.callbackId,
				args = data.args,
				callback = this.pendingCallbacks[callbackId];

			// Save any updated properties returned to us...
			if (data.props) {
				for (let propName in data.props) {
					if (data.props.hasOwnProperty(propName)) {
						this[propName] = data.props[propName];
					}
				}
			}

			if (callback) {
				delete this.pendingCallbacks[callbackId];
				callback.apply(this, args);
			}
		}
	};
}

export default OGVProxyClass;
