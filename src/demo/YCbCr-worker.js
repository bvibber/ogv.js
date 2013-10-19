/**
 * A simple background thread that listens for YCbCr buffers
 * and spits back RGB buffers.
 */

importScripts('lib/YCbCr.js');

// IE 10/11 don't allow to transfer an ArrayBuffer!
var canTransfer = !navigator.userAgent.match(/Trident/);

self.addEventListener('message', function(event) {
	var data = event.data;
	if (data.action == "convertYCbCr") {
		var rgbBuffer = convertYCbCr(data.buffer,
		                             data.width, data.height,
		                             data.hdec, data.vdec);
		var packet = {
			action: "result:" + data.action,
			id: data.id,
			buffer: rgbBuffer,
			width: data.width,
			height: data.height
		}
		if (canTransfer) {
			self.postMessage(packet, [rgbBuffer]);
		} else {
			self.postMessage(packet);
		}
	} else {
		throw new Error("Unexpected message action: " + event.data.action);
	}
});
