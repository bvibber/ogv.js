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

	OgvJsOutputFrame: function(bufferY, strideY,
	                           bufferCb, strideCb,
	                           bufferCr, strideCr,
	                           width, height,
	                           hdec, vdec) {
		
		// Create typed array views of the source buffers from the emscripten heap:
		var HEAPU8 = Module.HEAPU8,
			widthColor = width >> hdec,
			heightColor = height >> vdec,
			countBytesY = width * height,
			countBytesColor = widthColor * heightColor,
			inBytesY = HEAPU8.subarray(bufferY, bufferY + countBytesY),
			inBytesCb = HEAPU8.subarray(bufferCb, bufferCb + countBytesColor),
			inBytesCr = HEAPU8.subarray(bufferCr, bufferCr + countBytesColor)

		// Copy them over to a fresh buffer to transfer to output...
		var outBuffer = new ArrayBuffer(countBytesY + countBytesColor * 2),
			outBytes = new Uint8Array(outBuffer);
		
		for (var y = 0; y < height; y++) {
			var inPtrY = bufferY + y * strideY,
				inBytesY = HEAPU8.subarray(inPtrY, inPtrY + strideY);
			outBytes.set(inBytesY, y * width);
		}
		for (var y = 0; y < heightColor; y++) {
			var inPtrCb = bufferCb + y * strideCb,
				inBytesCb = HEAPU8.subarray(inPtrCb, inPtrCb + widthColor);
			outBytes.set(inBytesCb, countBytesY + y * widthColor);
		}
		for (var y = 0; y < heightColor; y++) {
			var inPtrCr = bufferCr + y * strideCr,
				inBytesCr = HEAPU8.subarray(inPtrCr, inPtrCr + widthColor);
			outBytes.set(inBytesCr, countBytesY + countBytesColor + y * widthColor);
		}

		// And queue up the output buffer!
		OgvJsFrameCallback(outBuffer);
	},
	
	OgvJsInitAudio: function(channels, rate) {
		OgvJsInitAudioCallback({
			codec: "Vorbis",
			channels: channels,
			rate: rate
		});
	},
	
	OgvJsOutputAudio: function(buffers, channels, sampleCount) {
		// buffers is an array of pointers to float arrays for each channel
		var HEAPU8 = Module.HEAPU8;
		var HEAPU32 = Module.HEAPU32;
		var HEAPF32 = Module.HEAPF32;
		
		var outputBuffers = [];
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
