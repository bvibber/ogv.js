mergeInto(LibraryManager.library, {

	ogvjs_callback_init_video: function(frameWidth, frameHeight,
	                                    hdec, vdec,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module.videoFormat = {
			frameWidth: frameWidth,
			frameHeight: frameHeight,
			hdec: hdec,
			vdec: vdec,
			fps: fps,
			picWidth: picWidth,
			picHeight: picHeight,
			picX: picX,
			picY: picY,
			displayWidth: displayWidth,
			displayHeight: displayHeight
		};
		Module.loadedMetadata = true;
	},

	ogvjs_callback_frame: function(bufferY, strideY,
	                               bufferCb, strideCb,
	                               bufferCr, strideCr,
	                               width, height,
	                               hdec, vdec) {

		// Create typed array views of the source buffers from the emscripten heap:
		var HEAPU8 = Module.HEAPU8,
			widthColor = width >> hdec,
			heightColor = height >> vdec,
			countBytesY = strideY * height,
			countBytesCb = strideCb * heightColor,
			countBytesCr = strideCr * heightColor,
			bytesY = HEAPU8.subarray(bufferY, bufferY + countBytesY),
			bytesCb = HEAPU8.subarray(bufferCb, bufferCb + countBytesCb),
			bytesCr = HEAPU8.subarray(bufferCr, bufferCr + countBytesCr);

		// And queue up the output buffer!
		Module.frameBuffer = {
			bytesY: bytesY,
			bytesCb: bytesCb,
			bytesCr: bytesCr,
			strideY: strideY,
			strideCb: strideCb,
			strideCr: strideCr,
			width: width,
			height: height,
			hdec: hdec,
			vdec: vdec
		};
	}

});
