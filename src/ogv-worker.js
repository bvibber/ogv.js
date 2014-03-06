/**
 * A simple background thread that accepts input ArrayBuffers
 * and sends back info, YCbCr frames, and audio buffers.
 */

importScripts('ogv.js');

var codec;

self.addEventListener('message', function( event) {
	var data = event.data;
	//console.log('Worker got: ', data);
	if (data.action == 'init') {
		codec = new OgvJs(data.options);
		codec.oninitvideo = function(info) {
			self.postMessage({
				action: 'oninitvideo',
				info: info
			});
		};
		codec.oninitaudio = function(info) {
			self.postMessage({
				action: 'oninitaudio',
				info: info
			});
		};
	} else if (data.action == 'destroy') {
		codec.destroy();
		codec = null;
	} else if (data.action == 'receiveInput') {
		codec.receiveInput(data.data);
	} else if (data.action == 'process') {
		result = codec.process(data.audioPosition, data.audioReady);
		var payload = {
			action: 'onprocess',
			result: result
		};
		if (codec.frameReady) {
			payload.frame = codec.dequeueFrame();
		}
		if (codec.audioReady) {
			var buffers = [];
			while (codec.audioReady) {
				buffers.push(codec.dequeueAudio());
			}
			payload.audio = buffers;
		}
		self.postMessage(payload);
	}

});
