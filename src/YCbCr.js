(function() {
	var global = this;

	/**
	 * @param ybcbr {bufferY, bufferCb, bufferCr, strideY, strideCb, strideCr, width, height, hdec, vdec}
	 * @param TypedArray output: CanvasPixelArray or Uint8ClampedArray to draw RGB into
	 */
	global.convertYCbCr = function convertYCbCr(ybcbr, output) {
		var width = ybcbr.width,
			height = ybcbr.height,
			hdec = ybcbr.hdec,
			vdec = ybcbr.vdec,
			bytesY = new Uint8Array(ybcbr.bufferY),
			bytesCb = new Uint8Array(ybcbr.bufferCb),
			bytesCr = new Uint8Array(ybcbr.bufferCr),
			processLine,
			strideY = ybcbr.strideY,
			strideCb = ybcbr.strideCb,
			strideCr = ybcbr.strideCr;
		
		if (hdec == vdec == 1) {
			// Optimize for 4:2:0, which is most common
			processLine = function convertYCbCr_processLine_420(y) {
				var xdec = 0,
					ydec = y >> vdec,
					YPtr = y * strideY,
					CbPtr = ydec * strideCb,
					CrPtr = ydec * strideCr,
					outPtr = y * 4 * width,
					colorY0, colorY1, colorCb, colorCr,
					multY0, multY1,
					multCrR, multCbG, multCrG, multCbB;
				
				for (var x = 0; x < width; x += 2) {
					xdec = x >> hdec;
					colorY0 = bytesY[YPtr + x];
					colorY1 = bytesY[YPtr + x + 1];
					colorCb = bytesCb[CbPtr + xdec];
					colorCr = bytesCr[CrPtr + xdec];
	
					// Quickie YUV conversion
					// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
					// multiplied by 256 for integer-friendliness
					multCrR = (409 * colorCr);
					multCbG = (100 * colorCb);
					multCrG = (208 * colorCr);
					multCbB = (516 * colorCb);
					
					multY0 = (298 * colorY0);
					output[outPtr++] = (multY0 + multCrR - 57088) >> 8;
					output[outPtr++] = (multY0 - multCbG - multCrG + 34816) >> 8;
					output[outPtr++] = (multY0 + multCbB - 70912) >> 8;
					output[outPtr++] = 255;

					multY1 = (298 * colorY1);
					output[outPtr++] = (multY1 + multCrR - 57088) >> 8;
					output[outPtr++] = (multY1 - multCbG - multCrG + 34816) >> 8;
					output[outPtr++] = (multY1 + multCbB - 70912) >> 8;
					output[outPtr++] = 255;
				}
			}
			for (var y = 0; y < height; y++) {
				processLine(y);
			}
		} else {
			failout();
			processLine = function convertYCbCr_processLine_clamped(y) {
				var xdec = 0,
					ydec = y >> vdec,
					YPtr = y * strideY,
					CbPtr = ydec * strideCb,
					CrPtr = ydec * strideCr,
					outPtr = y * 4 * width,
					colorY, colorCb, colorCr;
				
				for (var x = 0; x < width; x++) {
					xdec = x >> hdec;
					colorY = bytesY[YPtr + x];
					colorCb = bytesCb[CbPtr + xdec];
					colorCr = bytesCr[CrPtr + xdec];
	
					// Quickie YUV conversion
					// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
					// multiplied by 256 for integer-friendliness
					multY = (298 * colorY);
					output[outPtr++] = (multY + (409 * colorCr) - 57088) >> 8;
					output[outPtr++] = (multY - (100 * colorCb) - (208 * colorCr) + 34816) >> 8;
					output[outPtr++] = (multY + (516 * colorCb) - 70912) >> 8;
					output[outPtr++] = 255;
				}
			}
			for (var y = 0; y < height; y++) {
				processLine(y);
			}
		}
	}
})();
