/* global ArrayBuffer */

import OGVLoader from './OGVLoaderWorker.js';

/**
 * Web Worker wrapper for codec fun
 */
class OGVWorkerSupport {
	constructor(propList, handlers) {
		this.propList = propList;
		this.handlers = handlers;

		this.transferables = (() => {
			let buffer = new ArrayBuffer(1024),
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

		this.target = null;

		this.sentProps = {};
		this.pendingEvents = [];

		this.handlers.construct = (args, callback) => {
			let className = args[0],
				options = args[1];

			OGVLoader.loadClass(className, (classObj) => {
				classObj(options).then((target) => {
					this.target = target;
					callback();
					while (this.pendingEvents.length) {
						this.handleEvent(this.pendingEvents.shift());
					}
				});
			});
		};

		addEventListener('message', (event) => {
			this.workerOnMessage(event);
		});
	}

	handleEvent(data) {
		this.handlers[data.action].call(this, data.args, (args) => {
			args = args || [];

			// Collect and send any changed properties...
			let props = {},
				transfers = [];
			this.propList.forEach((propName) => {
				let propVal = this.target[propName];

				if (this.sentProps[propName] !== propVal) {
					// Save this value for later reference...
					this.sentProps[propName] = propVal;

					if (propName == 'duration' && isNaN(propVal) && isNaN(this.sentProps[propName])) {
						// NaN is not === itself. Nice!
						// no need to update it here.
					} else if (propName == 'audioBuffer') {
						// Buffers are already extracted from the heap.
						// Don't copy; they are safe to transfer.
						props[propName] = propVal;
						if (propVal) {
							for (let i = 0; i < propVal.length; i++) {
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

			let out = {
				action: 'callback',
				callbackId: data.callbackId,
				args: args,
				props: props
			};
			if (this.transferables) {
				postMessage(out, transfers);
			} else {
				postMessage(out);
			}
		});
	}

	workerOnMessage(event) {
		let data = event.data;
		if (!data || typeof data !== 'object') {
			// invalid
			return;
		} else if (data.action == 'transferTest') {
			// ignore
		} else if (typeof data.action !== 'string' || typeof data.callbackId !== 'string' || typeof data.args !== 'object') {
			console.log('invalid message data', data);
		} else if (!(data.action in this.handlers)) {
			console.log('invalid message action', data.action);
		} else if (data.action == 'construct') {
			// always handle constructor
			this.handleEvent(data);
		} else if (!this.target) {
			// queue until constructed
			this.pendingEvents.push(data);
		} else {
			this.handleEvent(data);
		}
	}
}

export default OGVWorkerSupport;
