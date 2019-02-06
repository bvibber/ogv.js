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

		function xmemcpy(destBuf, dest, srcBuf, src, len) {
			// Unrolled loop to byte-copy stuff.
			// Avoids creating temporary typed arrays for each line,
			// and is faster than TypedArray `set()` on IE 11.
			var start = src;
			var unrolled = src + len & ~7;
			var end = src + len;

			var inPtr = start;
			var outPtr = dest;
			for (; inPtr < unrolled; inPtr += 8, outPtr += 8) {
				destBuf[outPtr] = srcBuf[inPtr];
				destBuf[outPtr + 1] = srcBuf[inPtr + 1];
				destBuf[outPtr + 2] = srcBuf[inPtr + 2];
				destBuf[outPtr + 3] = srcBuf[inPtr + 3];
				destBuf[outPtr + 4] = srcBuf[inPtr + 4];
				destBuf[outPtr + 5] = srcBuf[inPtr + 5];
				destBuf[outPtr + 6] = srcBuf[inPtr + 6];
				destBuf[outPtr + 7] = srcBuf[inPtr + 7];
			}
			for (; inPtr < end; inPtr++, outPtr++) {
				destBuf[outPtr] = srcBuf[inPtr];
			}
		}

		var outBytesY = new Uint8Array(outStride * outHeight);
		for (y = 0; y < outHeight; y++) {
			var start = bufferY + (y + outPicY) * strideY + picX;
			xmemcpy(outBytesY, outStride * y, HEAPU8, start, outStride);
		}

		var outBytesU = new Uint8Array(outChromaStride * outChromaHeight);
		for (y = 0; y < outChromaHeight; y++) {
			var start = bufferCb + (y + chromaPicY) * strideCb + chromaPicX;
			xmemcpy(outBytesU, outChromaStride * y, HEAPU8, start, outChromaStride);
		}

		var outBytesV = new Uint8Array(outChromaStride * outChromaHeight);
		for (y = 0; y < outChromaHeight; y++) {
			var start = bufferCr + (y + chromaPicY) * strideCr + chromaPicX;
			xmemcpy(outBytesV, outChromaStride * y, HEAPU8, start, outChromaStride);
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
