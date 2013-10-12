mergeInto(LibraryManager.library, {
	
	OgvJsInitVideo: function(frameWidth, frameHeight,
                             fps,
                             picWidth, picHeight,
                             picX, picY) {
		OgvJsInitVideoCallback({
			codec: "Theora",
			frameWidth: frameWidth,
			frameHeight: frameHeight,
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
		// YCbCr whee
		var HEAPU8 = Module.HEAPU8;
		var imageData = OgvJsImageData(width, height);
		var data = imageData.data;
		var YPtr, CbPtr, CrPtr, outPtr;
		var xdec, ydec;
		var colorY, colorCb, colorCr;
		var multY;
		for (var y = 0; y < height; y++) {
			ydec = y >> vdec;
			YPtr = bufferY + y * strideY;
			CbPtr = bufferCb + ydec * strideCb;
			CrPtr = bufferCr + ydec * strideCr;
			outPtr = y * 4 * width;
			for (var x = 0; x < width; x++) {
				xdec = x >> hdec;
				colorY = HEAPU8[YPtr + x];
				colorCb = HEAPU8[CbPtr + xdec];
				colorCr = HEAPU8[CrPtr + xdec];
				
				// Quickie YUV conversion
				// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
				multY = (298.082 * colorY) / 256;
				data[outPtr++] = multY + (408.583 * colorCr) / 256 - 222.921;
				data[outPtr++] = multY - (100.291 * colorCb) / 256 - (208.120 * colorCr) / 256 + 135.576;
				data[outPtr++] = multY + (516.412 * colorCb) / 256 - 276.836;
				data[outPtr++] = 255;
			}
		}
		OgvJsFrameCallback(imageData);
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
				outArray[i] = HEAPF32[inBuffer / 4 + i];
			}
			outputBuffers.push(outArray);
		}

		OgvJsAudioCallback(outputBuffers);
	}

});
