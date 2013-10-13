/**
 * Object that we can throw audio data into and have it drain out.
 *
 * @todo better timing!
 * @todo resample input
 */
function AudioFeeder(channels, rate) {
	// assume W3C Audio API
	
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) {
		// stub it out
		console.log("No W3C Web Audio API available");
		this.bufferData = function(samplesPerChannel) {};
		this.close = function() {};
		this.mute = function() {};
		this.unmute = function() {};
		return;
	}
	
	
	var context = window.audioContext = new AudioContext(),
		bufferSize = 1024,
		node = window.audioNode = context.createScriptProcessor(bufferSize, 0, 2),
		buffers = [],
		muted = false;
	
	function popNextBuffer() {
		// hack hack
		// fixme: grab the right number of samples
		// and... rescale 
		if (buffers.length > 0) {
			return buffers.shift();
		}
	}

	node.onaudioprocess = function(event) {
		var inputBuffer = popNextBuffer(bufferSize);
		if (!muted && inputBuffer) {
			for (var channel = 0; channel < channels; channel++) {
				var input = inputBuffer[channel],
					output = event.outputBuffer.getChannelData(channel);
				for (var i = 0; i < Math.min(bufferSize, input.length); i++) {
					output[i] = input[i];
				}
			}
		} else {
			//console.log("Starved for audio!");
			for (var channel = 0; channel < channels; channel++) {
				var output = event.outputBuffer.getChannelData(channel);
				for (var i = 0; i < bufferSize; i++) {
					output[i] = 0;
				}
			}
		}
	};
	node.connect(context.destination);
	
	var self = this;
	this.bufferData = function(samplesPerChannel) {
		if (buffers) {
			buffers.push(samplesPerChannel);
		} else {
			self.close();
		}
	};
	
	this.mute = function() {
		muted = true;
	};
	
	this.unmute = function() {
		muted = false;
	}
	
	this.close = function() {
		if (node) {
			node.onaudioprocess = null;
			node.disconnect();
		}
		node = null;
		context = null;
		buffers = null;
	};
}
