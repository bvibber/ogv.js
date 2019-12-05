/* global LibraryManager */
/* global mergeInto */
/* global Module */
/* global wasmMemory */

mergeInto(LibraryManager.library, {

	ogvjs_callback_init_audio: function(channels, rate) {
		Module['audioFormat'] = {
			'channels': channels,
			'rate': rate
		};
		Module['loadedMetadata'] = true;
	},

	ogvjs_callback_audio: function(buffers, channels, sampleCount) {
		// buffers is an array of pointers to float arrays for each channel
		var heap = wasmMemory.buffer;
		var ptrs = new Uint32Array(heap, buffers, channels);
		var outputBuffers = [];
		if (buffers !== 0) {
			var inPtr, inArray, inBuffer, outArray, i;
			for (var channel = 0; channel < channels; channel++) {
				inPtr = ptrs[channel];
				if (heap.slice) {
					inBuffer = heap.slice(inPtr, inPtr + sampleCount * 4);
					outArray = new Float32Array(inBuffer);
				} else {
					// IE 10 - use copy constructor
					inArray = new Float32Array(heap, inPtr, sampleCount);
					outArray = new Float32Array(inArray);
				}
				outputBuffers.push(outArray);
			}
		}

		Module['audioBuffer'] = outputBuffers;
	}

});
