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

		var outPicX = picX & ~1; // round down to divisible by 2
		var outPicY = picY & ~1; // round down to divisible by 2
		var chromaPicX = outPicX * chromaWidth / width;
		var chromaPicY = outPicY * chromaHeight / height;

		function xmemcpy(dest8, dest32, dest, src8, src32, src, len) {
			// Unrolled loop to byte-copy stuff.
			// Avoids creating temporary typed arrays for each line,
			// and is faster than TypedArray `set()` on IE 11.
			var start = src;
			var end = src + len;

			var inPtr32 = start >> 2;
			var outPtr32 = dest >> 2;
			var len32 = len >> 2;
			var end32 = inPtr32 + len32;
			for (; inPtr32 < end32; inPtr32++, outPtr32++) {
				dest32[outPtr32] = src32[inPtr32];
			}
			var inPtr = inPtr32 << 2;
			var outPtr = outPtr32 << 2;
			for (; inPtr < end; inPtr++, outPtr++) {
				dest8[outPtr] = src8[inPtr];
			}
		}

		var outBytesY = new Uint8Array(outStride * outHeight);
		var outQuadY = new Uint32Array(outBytesY.buffer);
		var bufferYStart = bufferY + outPicY * strideY + outPicX;
		var inBytesY = new Uint8Array(HEAPU8.buffer, bufferYStart);
		var inQuadY = new Uint32Array(HEAPU8.buffer, bufferYStart);
		for (y = 0; y < outHeight; y++) {
			xmemcpy(outBytesY, outQuadY, outStride * y,
					inBytesY, inQuadY, strideY * y,
					outStride);
		}

		var outBytesU = new Uint8Array(outChromaStride * outChromaHeight);
		var outQuadU = new Uint32Array(outBytesU.buffer);
		var bufferCbStart = bufferCb + chromaPicY * strideCb + chromaPicX;
		var inBytesU = new Uint8Array(HEAPU8.buffer, bufferCbStart);
		var inQuadU = new Uint32Array(HEAPU8.buffer, bufferCbStart);
		for (y = 0; y < outChromaHeight; y++) {
			xmemcpy(outBytesU, outQuadU, outChromaStride * y,
					inBytesU, inQuadU, strideCb * y,
					outChromaStride);
		}

		var outBytesV = new Uint8Array(outChromaStride * outChromaHeight);
		var outQuadV = new Uint32Array(outBytesV.buffer);
		var bufferCrStart = bufferCr + chromaPicY * strideCr + chromaPicX;
		var inBytesV = new Uint8Array(HEAPU8.buffer, bufferCrStart);
		var inQuadV = new Uint32Array(HEAPU8.buffer, bufferCrStart);
		for (y = 0; y < outChromaHeight; y++) {
			xmemcpy(outBytesV, outQuadV, outChromaStride * y,
					inBytesV, inQuadV, strideCr * y,
					outChromaStride);
		}

		var format = Module['videoFormat'];
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
