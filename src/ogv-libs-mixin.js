mergeInto(LibraryManager.library, {
	
	OgvJsInitVideo: function(frameWidth, frameHeight,
	                         hdec, vdec,
                             fps,
                             picWidth, picHeight,
                             picX, picY) {
		OgvJsInitVideoCallback({
			codec: "Theora",
			frameWidth: frameWidth,
			frameHeight: frameHeight,
			hdec: hdec,
			vdec: vdec,
			fps: fps,
			picWidth: picWidth,
			picHeight: picHeight,
			picX: picX,
			picY: picY
		});
	},

	OgvJsOutputFrameReady: function(videoPosition) {
		OgvJsOutputFrameReadyCallback(videoPosition);
	},
	
	OgvJsOutputFrame: function(bufferY, strideY,
	                           bufferCb, strideCb,
	                           bufferCr, strideCr,
	                           width, height,
	                           hdec, vdec) {
		
		if (bufferY == 0) {
			OgvJsFrameCallback(null);
			return;
		}
		
		// Create typed array views of the source buffers from the emscripten heap:
		var HEAPU8 = Module.HEAPU8,
			HEAPU32 = Module.HEAPU32,
			widthColor = width >> hdec,
			heightColor = height >> vdec,
			countBytesY = strideY * height,
			countBytesCb = strideCb * heightColor,
			countBytesCr = strideCr * heightColor,
			inDwordsY = HEAPU32.subarray(bufferY / 4, (bufferY + countBytesY) / 4),
			inDwordsCb = HEAPU32.subarray(bufferCb / 4, (bufferCb + countBytesCb) / 4),
			inDwordsCr = HEAPU32.subarray(bufferCr / 4, (bufferCr + countBytesCr) / 4),
			bufferY = new ArrayBuffer(countBytesY),
			bufferCb = new ArrayBuffer(countBytesCb),
			bufferCr = new ArrayBuffer(countBytesCr),
			dwordsY = new Uint32Array(bufferY),
			dwordsCb = new Uint32Array(bufferCb),
			dwordsCr = new Uint32Array(bufferCr);

		// These copies may not be packed efficiently,
		// but it's easier than guessing the internal format.
		dwordsY.set(inDwordsY);
		dwordsCb.set(inDwordsCb);
		dwordsCr.set(inDwordsCr);

		// And queue up the output buffer!
		OgvJsFrameCallback({
			bufferY: bufferY,
			bufferCb: bufferCb,
			bufferCr: bufferCr,
			strideY: strideY,
			strideCb: strideCb,
			strideCr: strideCr,
			width: width,
			height: height,
			hdec: hdec,
			vdec: vdec
		});
	},
	
	OgvJsInitAudio: function(channels, rate) {
		OgvJsInitAudioCallback({
			codec: "Vorbis",
			channels: channels,
			rate: rate
		});
	},
	
	OgvJsOutputAudioReady: function() {
		OgvJsOutputAudioReadyCallback();
	},
	
	OgvJsOutputAudio: function(buffers, channels, sampleCount) {
		if (buffers == 0) {
			OgvJsAudioCallback(null);
			return;
		}
		
		// buffers is an array of pointers to float arrays for each channel
		var HEAPU8 = Module.HEAPU8;
		var HEAPU32 = Module.HEAPU32;
		var HEAPF32 = Module.HEAPF32;
		
		var outputBuffers = [];
		if (buffers != 0) {
			var inBuffer, outBuffer, outArray, i;
			for (var channel = 0; channel < channels; channel++) {
				inBuffer = HEAPU32[buffers / 4 + channel];
				outBuffer = new ArrayBuffer(sampleCount * 4);
				outArray = new Float32Array(outBuffer);
				for (i = 0; i < sampleCount; i++) {
					outArray[i] = HEAPF32[inBuffer / 4 + i] ;
				}
				outputBuffers.push(outArray);
			}
		}

		OgvJsAudioCallback(outputBuffers);
	},

	OgvJsOutputAudioInt: function(buffers, channels, sampleCount) {
		// buffers is an array of pointers to int arrays for each channel
		var HEAP32 = Module.HEAP32;
		
		var outputBuffers = [];
		var inBuffer, outBuffer, outArray, i;
		for (var channel = 0; channel < channels; channel++) {
			inBuffer = HEAP32[buffers / 4 + channel];
			outBuffer = new ArrayBuffer(sampleCount * 4);
			outArray = new Float32Array(outBuffer);
			for (i = 0; i < sampleCount; i++) {
				// not 100% sure but we think it's 8.24 fixed point
				outArray[i] = HEAP32[inBuffer / 4 + i] / 16777216 ;
			}
			outputBuffers.push(outArray);
		}

		OgvJsAudioCallback(outputBuffers);
	}

});
