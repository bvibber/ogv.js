/**
 * Object that we can throw audio data into and have it drain out.
 *
 * Because changing the number of channels on the fly is hard, hardcoding
 * to 2 output channels. That's also all we can do on IE with Flash output.
 *
 * @todo better timing!
 */
function AudioFeeder() {
	// assume W3C Audio API
	var self = this;
	
	var AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) {
		// use Flash fallback
		console.log("No W3C Web Audio API available");
		this.flashaudio = new DynamicAudio();
	}
	

	var bufferSize = 4096,
		channels = 0, // call init()!
		rate = 0; // call init()!

	// Always create stereo output. For iOS we have to set this stuff up
	// before we've actually gotten the info from the codec because we
	// must initialize from a UI event. Bah!
	var outputChannels = 2;

	function freshBuffer() {
		var buffer = [];
		for (var channel = 0; channel < outputChannels; channel++) {
			buffer[channel] = new Float32Array(bufferSize);
		}
		return buffer;
	}
	
	var buffers = [],
		context,
		node,
		pendingBuffer = freshBuffer(),
		pendingPos = 0,
		muted = false,
		bufferHead = 0,
		playbackTimeAtBufferHead = 0;

	if(AudioContext) {
		context = new AudioContext;
		if (context.createScriptProcessor) {
			node = context.createScriptProcessor(bufferSize, 0, outputChannels)
		} else if (context.createJavaScriptNode) {
			node = context.createJavaScriptNode(bufferSize, 0, outputChannels)
		} else {
			throw new Error("Bad version of web audio API?");
		}
	}
	
	function popNextBuffer() {
		// hack hack
		// fixme: grab the right number of samples
		// and... rescale 
		if (buffers.length > 0) {
			return buffers.shift();
		}
	}

	if(node) {
		node.onaudioprocess = function(event) {
			if (typeof event.playbackTime === "number") {
				playbackTimeAtBufferHead = event.playbackTime;
			} else if (typeof event.timeStamp === "number") {
				playbackTimeAtBufferHead = (event.timeStamp - Date.now()) / 1000 + context.currentTime;
			} else {
				console.log("Unrecognized AudioProgressEvent format, no playbackTime or timestamp");
			}
			var inputBuffer = popNextBuffer(bufferSize);
			if (!muted && inputBuffer) {
				bufferHead += (bufferSize / rate);
				for (var channel = 0; channel < outputChannels; channel++) {
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
				for (var channel = 0; channel < outputChannels; channel++) {
					var output = event.outputBuffer.getChannelData(channel);
					for (var i = 0; i < bufferSize; i++) {
						output[i] = 0;
					}
				}
			}
		};
		node.connect(context.destination);
	}
	
	/**
	 * This is horribly naive and wrong.
	 * Replace me with a better algo!
	 */
	function resample(samples) {
		var targetRate = context.sampleRate;
		if (rate == targetRate && channels == outputChannels) {
			return samples;
		} else {
			var newSamples = [];
			for (var channel = 0; channel < outputChannels; channel++) {
				var inputChannel = channel;
				if (channel >= channels) {
					inputChannel = 0;
				}
				var input = samples[inputChannel],
					output = new Float32Array(Math.round(input.length * targetRate / rate));
				for (var i = 0; i < output.length; i++) {
					output[i] = input[(i * rate / targetRate) | 0];
				}
				newSamples.push(output);
			}
			return newSamples;
		}
	}

	/**
	 * Resampling, scaling and reordering for the Flash fallback.
	 * The Flash fallback expects 44.1 kHz, stereo
	 * Resampling: This is horribly naive and wrong.
	 * TODO: Replace me with a better algo!
	 */
	function resampleFlash(samples) {
		var sampleincr = rate / 44100;
		var samplecount = (samples[0].length * (44100 / rate)) | 0;
		var newSamples = new Array(samplecount * channels);
		var channel1 = channels > 1 ? 1 : 0;
		for(var s = 0; s < samplecount; s++) {
			var idx = (s * sampleincr) | 0;
			var idx_out = s * 2;
			newSamples[idx_out] = (samples[0][idx] * 32768) | 0;
			newSamples[idx_out + 1] = (samples[channel1][idx] * 32768) | 0;
		}
		return newSamples;
	}

	
	function pushSamples(samples) {
		var firstChannel = samples[0],
			sampleCount = firstChannel.length;
		for (var i = 0; i < sampleCount; i++) {
			for (var channel = 0; channel < outputChannels; channel++) {
				pendingBuffer[channel][pendingPos] = samples[channel][i];
			}
			if (++pendingPos == bufferSize) {
				buffers.push(pendingBuffer);
				pendingPos = 0;
				pendingBuffer = freshBuffer();
			}
		}
	}
	
	this.init = function(numChannels, sampleRate) {
		// warning: can't change channels here reliably
		rate = sampleRate;
		channels = numChannels;
		pendingBuffer = freshBuffer();
	};
	
	this.bufferData = function(samplesPerChannel) {
		if(this.flashaudio) {
			var resamples = resampleFlash(samplesPerChannel);
			var flashElement = this.flashaudio.flashElement;
			if(resamples.length > 0 && flashElement.write) {
				flashElement.write(resamples.join(' '));
			}
			bufferHead += (samplesPerChannel[0].length / rate);
		} else if (buffers) {
			samples = resample(samplesPerChannel);
			pushSamples(samples);
		} else {
			self.close();
		}
	};
	
	this.isBufferNearEmpty = function() {
		if (this.flashaudio) {
			var flashElement = this.flashaudio.flashElement;
			if (flashElement.write) {
				var samplesQueued = flashElement.samplesQueued();
				return samplesQueued <= bufferSize * 2;
			} else {
				// still initializing...
				return true;
			}
		} else if (buffers) {
			var samplesQueued = 0;
			buffers.forEach(function(buffer) {
				samplesQueued += buffer[0].length;
			});
			return samplesQueued <= bufferSize;
		} else {
			return true;
		}
	};
	
	this.playbackPosition = function() {
		if (this.flashaudio) {
			var flashElement = this.flashaudio.flashElement;
			if (flashElement.write) {
				return flashElement.playbackPosition();
			} else {
				return 0;
			}
		} else {
			return bufferHead - (playbackTimeAtBufferHead - context.currentTime);
		}
	}
	
	this.mute = function() {
		muted = true;
	};
	
	this.unmute = function() {
		muted = false;
	}
	
	this.close = function() {
		if(this.flashaudio) {
			var wrapper = this.flashaudio.flashWrapper;
			wrapper.parentNode.removeChild(wrapper);
			this.flashaudio = null;
		} else if (node) {
			node.onaudioprocess = null;
			node.disconnect();
		}
		node = null;
		context = null;
		buffers = null;
	};
}


/** Flash fallback **/

/*
The Flash fallback is based on https://github.com/an146/dynamicaudio.js

This is the contents of the LICENSE file:

Copyright (c) 2010, Ben Firshman
All rights reserved.
 
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
 
 * Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 * The names of its contributors may not be used to endorse or promote products
   derived from this software without specific prior written permission.
 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


function DynamicAudio(args) {
	if (this instanceof arguments.callee) {
		if (typeof this.init === "function") {
			this.init.apply(this, (args && args.callee) ? args : arguments);
		}
	} else {
		return new arguments.callee(arguments);
	}
}


DynamicAudio.nextId = 1;

DynamicAudio.prototype = {
	nextId: null,
	swf: 'dynamicaudio.swf',

	flashWrapper: null,
	flashElement: null,
    
	init: function(opts) {
		var self = this;
		self.id = DynamicAudio.nextId++;

		if (opts && typeof opts['swf'] !== 'undefined') {
			self.swf = opts['swf'];
		}

		self.flashWrapper = document.createElement('div');
		self.flashWrapper.id = 'dynamicaudio-flashwrapper-'+self.id;
		// Credit to SoundManager2 for this:
		var s = self.flashWrapper.style;
		s['position'] = 'fixed';
		s['width'] = '11px'; // must be at least 6px for flash to run fast
		s['height'] = '11px';
		s['bottom'] = s['left'] = '0px';
		s['overflow'] = 'hidden';
		self.flashElement = document.createElement('div');
		self.flashElement.id = 'dynamicaudio-flashelement-'+self.id;
		self.flashWrapper.appendChild(self.flashElement);

		document.body.appendChild(self.flashWrapper);

		var id = self.flashElement.id;

		self.flashWrapper.innerHTML = "<object id='"+id+"' width='10' height='10' type='application/x-shockwave-flash' data='"+self.swf+"' style='visibility: visible;'><param name='allowscriptaccess' value='always'></object>";
		self.flashElement = document.getElementById(id);
	},
};

