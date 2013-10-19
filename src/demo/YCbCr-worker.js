/**
 * A simple background thread that listens for YCbCr buffers
 * and spits back RGB buffers.
 */

importScripts('lib/YCbCr.js');

var canTransfer = undefined;

self.addEventListener('message', function(event) {
	var data = event.data;
	if (data.action == "convertYCbCr") {
		var buffer = convertYCbCr(data.buffer,
		                             data.width, data.height,
		                             data.hdec, data.vdec);
		var packet = {
			action: "result:" + data.action,
			id: data.id,
			buffer: buffer,
			width: data.width,
			height: data.height
		}
		if (canTransfer === true) {
			self.postMessage(packet, [buffer]);
		} else if (canTransfer === false) {
			self.postMessage(packet);
		} else {
			try {
				self.postMessage(packet, [buffer]);
			} catch (e) {
				// IE 10/11 throw an exception if you try to
				// transfer an ArrayBuffer. This is annoying.
				self.postMessage(packet);
			}
			if (buffer.byteLength == 0) {
				canTransfer = true;
			} else {
				canTransfer = false;
			}
		}
	} else {
		throw new Error("Unexpected message action: " + event.data.action);
	}
});
