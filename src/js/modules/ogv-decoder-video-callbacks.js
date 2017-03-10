/* global LibraryManager */
/* global mergeInto */
/* global Module */

mergeInto(LibraryManager.library, {

	ogvjs_callback_init_video: function(frameWidth, frameHeight,
	                                    chromaWidth, chromaHeight,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module.videoFormat = {
			width: frameWidth,
			height: frameHeight,
			chromaWidth: chromaWidth,
			chromaHeight: chromaHeight,
			cropLeft: picX,
			cropTop: picY,
			cropWidth: picWidth,
			cropHeight: picHeight,
			displayWidth: displayWidth,
			displayHeight: displayHeight,
			fps: fps
		};
		Module.loadedMetadata = true;
	},

	ogvjs_callback_frame: function(bufferY, strideY,
	                               bufferCb, strideCb,
	                               bufferCr, strideCr,
	                               width, height,
	                               chromaWidth, chromaHeight) {

		// Create typed array copies of the source buffers from the emscripten heap:
		var HEAPU8 = Module.HEAPU8,
			format = Module.videoFormat,
			countBytesY = strideY * height,
			countBytesCb = strideCb * chromaHeight,
			countBytesCr = strideCr * chromaHeight;

		// And queue up the output buffer!
		Module.frameBuffer = {
			// @fixme what to do about the crop coordinates if resolution changes? can this happen in webm land? what about if ogv gets a new steam?
			format: {
				width: width,
				height: height,
				chromaWidth: chromaWidth,
				chromaHeight: chromaHeight,
				cropLeft: format.cropLeft,
				cropTop: format.cropTop,
				cropWidth: format.cropWidth,
				cropHeight: format.cropHeight,
				displayWidth: format.displayWidth,
				displayHeight: format.displayHeight
			},
			y: {
				bytes: copyByteArray(HEAPU8.subarray(bufferY, bufferY + countBytesY)),
				stride:strideY
			},
			u: {
				bytes: copyByteArray(HEAPU8.subarray(bufferCb, bufferCb + countBytesCb)),
				stride: strideCb
			},
			v: {
				bytes: copyByteArray(HEAPU8.subarray(bufferCr, bufferCr + countBytesCr)),
				stride: strideCr
			}
		};
	},
	
	ogvjs_callback_async_complete: function(ret, cpuTime) {
		var callback = Module.callbacks.shift();
		Module.cpuTime += cpuTime;
		callback(ret);
		return;
	}

});
