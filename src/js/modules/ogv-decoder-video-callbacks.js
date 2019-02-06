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
			format = Module['videoFormat'],
			countBytesY = strideY * height,
			countBytesCb = strideCb * chromaHeight,
			countBytesCr = strideCr * chromaHeight;

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
				'bytes': copyByteArray(HEAPU8.subarray(bufferY, bufferY + countBytesY)),
				'stride': strideY
			},
			'u': {
				'bytes': copyByteArray(HEAPU8.subarray(bufferCb, bufferCb + countBytesCb)),
				'stride': strideCb
			},
			'v': {
				'bytes': copyByteArray(HEAPU8.subarray(bufferCr, bufferCr + countBytesCr)),
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
