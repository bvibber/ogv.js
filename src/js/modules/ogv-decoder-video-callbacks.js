/* global LibraryManager */
/* global mergeInto */
/* global Module */
/* global copyByteArray */

mergeInto(LibraryManager.library, {

	ogvjs_callback_init_video: function(frameWidth, frameHeight,
	                                    chromaWidth, chromaHeight,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module['videoFormat'] = {
			'width': frameWidth,
			'height': frameHeight,
			'chromaWidth': chromaWidth,
			'chromaHeight': chromaHeight,
			'cropLeft': picX,
			'cropTop': picY,
			'cropWidth': picWidth,
			'cropHeight': picHeight,
			'displayWidth': displayWidth,
			'displayHeight': displayHeight,
			'fps': fps
		};
		Module['loadedMetadata'] = true;
	},

	ogvjs_callback_frame: function(bufferY, strideY,
	                               bufferCb, strideCb,
	                               bufferCr, strideCr,
	                               width, height,
								   chromaWidth, chromaHeight,
								   picWidth, picHeight,
								   picX, picY,
								   displayWidth, displayHeight) {

		// Create typed array copies of the source buffers from the emscripten heap:
		var HEAPU8 = new Uint8Array(wasmMemory.buffer),
			format = Module['videoFormat'];

		function copyAndTrim(buffer, stride, height, picX, picY, picWidth, picHeight, fill) {
			var arr = copyByteArray(HEAPU8.subarray(buffer, buffer +  stride * height));

			// Trim out anything outside the visible area
			// Protected against green stripes in some codecs (VP9)
			var x, y, ptr;
			for (ptr = 0, y = 0; y < picY; y++, ptr += stride) {
				for (x = 0; x < stride; x++) {
					arr[ptr + x] = fill;
				}
			}
			for (; y < picY + picHeight; y++, ptr += stride) {
				for (x = 0; x < picX; x++) {
					arr[ptr + x] = fill;
				}
				for (x = picX + picWidth; x < stride; x++) {
					arr[ptr + x] = fill;
				}
			}
			for (; y < height; y++, ptr += stride) {
				for (x = 0; x < stride; x++) {
					arr[ptr + x] = fill;
				}
			}
			return arr;
		}

		var outPicX = picX & ~1; // round down to divisible by 2
		var outPicY = picY & ~1; // round down to divisible by 2
		var chromaPicX = outPicX * chromaWidth / width;
		var chromaPicY = outPicY * chromaHeight / height;
		var chromaPicWidth = picWidth * chromaWidth / width;
		var chromaPicHeight = picHeight * chromaHeight / height;

		var isOriginal = (picWidth === format['cropWidth'])
					  && (picHeight === format['cropHeight']);
		if (isOriginal) {
			// This feels wrong, but in practice the WebM VP8 files I've found
			// with non-square pixels list 1920x1080 in the WebM header for
			// display size but 1440x1080 in the VP8 frame.
			//
			// Using the container-derived info to override for the original
			// resolution gets these files working, while allowing VP8 and VP9
			// files that change resolution and specify their pixels properly
			// to keep working.
			displayWidth = format['displayWidth'];
			displayHeight = format['displayHeight'];
		}
		// And queue up the output buffer!
		Module['frameBuffer'] = {
			'format': {
				'width': width,
				'height': height,
				'chromaWidth': chromaWidth,
				'chromaHeight': chromaHeight,
				'cropLeft': picX,
				'cropTop': picY,
				'cropWidth': picWidth,
				'cropHeight': picHeight,
				'displayWidth': displayWidth,
				'displayHeight': displayHeight
			},
			'y': {
				'bytes': copyAndTrim(bufferY, strideY, height, picX, picY, picWidth, picHeight, 0),
				'stride': strideY
			},
			'u': {
				'bytes': copyAndTrim(bufferCb, strideCb, chromaHeight, chromaPicX, chromaPicY, chromaPicWidth, chromaPicHeight, 128),
				'stride': strideCb
			},
			'v': {
				'bytes': copyAndTrim(bufferCr, strideCr, chromaHeight, chromaPicX, chromaPicY, chromaPicWidth, chromaPicHeight, 128),
				'stride': strideCr
			}
		};
	},
	
	ogvjs_callback_async_complete: function(ret, cpuTime) {
		var callback = Module.callbacks.shift();
		Module['cpuTime'] += cpuTime;
		callback(ret);
		return;
	}

});
