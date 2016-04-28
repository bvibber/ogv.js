/* global LibraryManager */
/* global mergeInto */
/* global Module */

mergeInto(LibraryManager.library, {

	ogvjs_callback_init_audio: function(channels, rate) {
		Module.audioFormat = {
			channels: channels,
			rate: rate
		};
		Module.loadedMetadata = true;
	},

	ogvjs_callback_audio: function(buffers, channels, sampleCount) {
		// buffers is an array of pointers to float arrays for each channel
		var HEAPU32 = Module.HEAPU32;
		var HEAPF32 = Module.HEAPF32;

		var outputBuffers = [];
		if (buffers !== 0) {
			var inPtr, inArray, outArray, i;
			for (var channel = 0; channel < channels; channel++) {
				inPtr = HEAPU32[buffers / 4 + channel];
				inArray = HEAPF32.subarray(inPtr / 4, inPtr / 4 + sampleCount);
				outArray = new Float32Array(inArray);
				outputBuffers.push(outArray);
			}
		}

		Module.audioBuffer = outputBuffers;
	}

});
