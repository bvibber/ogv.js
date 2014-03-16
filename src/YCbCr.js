(function() {
	var global = this;

	/**
	 * @param ybcbr {bytesY, bytesCb, bytesCr, strideY, strideCb, strideCr, width, height, hdec, vdec}
	 * @param TypedArray output: CanvasPixelArray or Uint8ClampedArray to draw RGB into
	 * Assumes that the output array already has alpha channel set to opaque.
	 */
	global.convertYCbCr = function convertYCbCr(ybcbr, output) {
		var width = ybcbr.width,
			height = ybcbr.height,
			hdec = ybcbr.hdec,
			vdec = ybcbr.vdec,
			bytesY = ybcbr.bytesY,
			bytesCb = ybcbr.bytesCb,
			bytesCr = ybcbr.bytesCr,
			strideY = ybcbr.strideY,
			strideCb = ybcbr.strideCb,
			strideCr = ybcbr.strideCr;
		
		if (hdec == vdec == 1) {
			// Optimize for 4:2:0, which is most common
			var outStride = 4 * width,
				outPtr0 = 0,
				outPtr1 = outStride,
				ydec = 0,
				colorCb, colorCr,
				multY00, multY01, multY10, multY11,
				multCrR, multCbCrG, multCbB;
			for (var y = 0; y < height; y += 2) {
				var Y0Ptr = y * strideY,
					Y1Ptr = Y0Ptr + strideY,
					CbPtr = ydec * strideCb,
					CrPtr = ydec * strideCr;
				for (var x = 0; x < width; x += 2) {
					colorCb = bytesCb[CbPtr++];
					colorCr = bytesCr[CrPtr++];

					// Quickie YUV conversion
					// https://en.wikipedia.org/wiki/YCbCr#ITU-R_BT.2020_conversion
					// multiplied by 256 for integer-friendliness
					multCrR = (409 * colorCr) - 57088;
					multCbCrG = (100 * colorCb) + (208 * colorCr) - 34816;
					multCbB = (516 * colorCb) - 70912;
					
					multY00 = (298 * bytesY[Y0Ptr++]);
					output[outPtr0++] = (multY00 + multCrR) >> 8;
					output[outPtr0++] = (multY00 - multCbCrG) >> 8;
					output[outPtr0++] = (multY00 + multCbB) >> 8;
					outPtr0++;

					multY01 = (298 * bytesY[Y0Ptr++]);
					output[outPtr0++] = (multY01 + multCrR) >> 8;
					output[outPtr0++] = (multY01 - multCbCrG) >> 8;
					output[outPtr0++] = (multY01 + multCbB) >> 8;
					outPtr0++;
					
					multY10 = (298 * bytesY[Y1Ptr++]);
					output[outPtr1++] = (multY10 + multCrR) >> 8;
					output[outPtr1++] = (multY10 - multCbCrG) >> 8;
					output[outPtr1++] = (multY10 + multCbB) >> 8;
					outPtr1++;

					multY11 = (298 * bytesY[Y1Ptr++]);
					output[outPtr1++] = (multY11 + multCrR) >> 8;
					output[outPtr1++] = (multY11 - multCbCrG) >> 8;
					output[outPtr1++] = (multY11 + multCbB) >> 8;
					outPtr1++;
				}
				outPtr0 += outStride;
				outPtr1 += outStride;
				ydec++;
			}
		} else {
			for (var y = 0; y < height; y++) {
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
					outPtr++;
				}
			}
		}
	}
})();
