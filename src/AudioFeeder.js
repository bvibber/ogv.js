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
		this.stub = true;
		return;
	}
	
	
	var context = new AudioContext(),
		bufferSize = 1024,
		node;
	
	function freshBuffer() {
		var buffer = [];
		for (var channel = 0; channel < channels; channel++) {
			buffer[channel] = new Float32Array(bufferSize);
		}
		return buffer;
	}
	
	var buffers = [],
		pendingBuffer = freshBuffer(),
		pendingPos = 0,
		muted = false;
	
	if (context.createScriptProcessor) {
		node = context.createScriptProcessor(bufferSize, 0, channels)
	} else if (context.createJavaScriptNode) {
		node = context.createJavaScriptNode(bufferSize, 0, channels)
	} else {
		throw new Error("Bad version of web audio API?");
	}
	
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
			if (!inputBuffer) {
				console.log("Starved for audio!");
			}
			for (var channel = 0; channel < channels; channel++) {
				var output = event.outputBuffer.getChannelData(channel);
				for (var i = 0; i < bufferSize; i++) {
					output[i] = 0;
				}
			}
		}
	};
	node.connect(context.destination);
	
	/**
	 * This is horribly naive and wrong.
	 * Replace me with a better algo!
	 */
	function resample(samples) {
		if (rate == context.sampleRate) {
			return samples;
		} else {
			var newSamples = [];
			for (var channel = 0; channel < channels; channel++) {
				var input = samples[channel],
					output = new Float32Array(Math.round(input.length * context.sampleRate / rate));
				for (var i = 0; i < output.length; i++) {
					output[i] = input[Math.floor(i * rate / context.sampleRate)];
				}
				newSamples.push(output);
			}
			return newSamples;
		}
	}
	
	function pushSamples(samples) {
		var firstChannel = samples[0],
			sampleCount = firstChannel.length;
		for (var i = 0; i < sampleCount; i++) {
			for (var channel = 0; channel < channels; channel++) {
				pendingBuffer[channel][pendingPos] = samples[channel][i];
			}
			if (++pendingPos == bufferSize) {
				buffers.push(pendingBuffer);
				pendingPos = 0;
				pendingBuffer = freshBuffer();
			}
		}
	}
	
	var self = this;
	this.bufferData = function(samplesPerChannel) {
		if (buffers) {
			samples = resample(samplesPerChannel);
			pushSamples(samples);
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
