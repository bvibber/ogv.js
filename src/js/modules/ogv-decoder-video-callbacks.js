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
		var HEAPU8 = Module['HEAPU8'],
			y;

		// Copy just the visible portions, we don't need the rest.
		var outStride = (picWidth + 7) & ~7; // round up to divisible by 8
		var outHeight = (picHeight + 7) & ~7; // round up to divisible by 8
		var outChromaStride = outStride * chromaWidth / width;
		var outChromaHeight = outHeight * chromaHeight / height;

		var outPicX = (picX + 1) & ~1; // round up to divisible by 2
		var outPicY = (picY + 1) & ~1; // round up to divisible by 2
		var chromaPicX = outPicX * chromaWidth / width;
		var chromaPicY = outPicY * chromaHeight / height;

		var outBytesY = new Uint8Array(outStride * outHeight);
		for (y = 0; y < outHeight; y++) {
			var start = bufferY + (y + outPicY) * strideY + picX;
			var src = HEAPU8.subarray(start, start + outStride);
			outBytesY.set(src, outStride * y);
		}

		var outBytesU = new Uint8Array(outChromaStride * outChromaHeight);
		for (y = 0; y < outChromaHeight; y++) {
			var start = bufferCb + (y + chromaPicY) * strideCb + chromaPicX;
			var src = HEAPU8.subarray(start, start + outChromaStride);
			outBytesU.set(src, outChromaStride * y);
		}

		var outBytesV = new Uint8Array(outChromaStride * outChromaHeight);
		for (y = 0; y < outChromaHeight; y++) {
			var start = bufferCr + (y + chromaPicY) * strideCr + chromaPicX;
			var src = HEAPU8.subarray(start, start + outChromaStride);
			outBytesV.set(src, outChromaStride * y);
		}

		// And queue up the output buffer!
		Module['frameBuffer'] = {
			'format': {
				'width': outStride,
				'height': outHeight,
				'chromaWidth': outChromaStride,
				'chromaHeight': outChromaHeight,
				'cropLeft': picX - outPicX,
				'cropTop': picY - outPicY,
				'cropWidth': picWidth,
				'cropHeight': picHeight,
				'displayWidth': displayWidth,
				'displayHeight': displayHeight
			},
			'y': {
				'bytes': outBytesY,
				'stride': outStride
			},
			'u': {
				'bytes': outBytesU,
				'stride': outChromaStride
			},
			'v': {
				'bytes': outBytesV,
				'stride': outChromaStride
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
