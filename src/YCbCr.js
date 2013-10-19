(function() {
	var global = this;

	/**
	 * @param buffer ArrayBuffer buffer holding the Y, Cb, and Cr planes in sequence
	 * @param TypedArray output: CanvasPixelArray or Uint8ClampedArray to draw RGB into
	 * @param number width width of buffer in pixels
	 * @param number height height of buffer in pixels
	 * @param number hdec 1 if color is horizontally decimated
	 * @param number vdec 1 if color is vertically decimated
	 *
	 * @return ArrayBuffer output as RGBA (opaque)
	 */
	global.convertYCbCr = function convertYCbCr(buffer, output, width, height, hdec, vdec) {
		var countBytesY = width * height,
			countBytesColor = (width >> hdec) * (height >> vdec),
			bytesY = new Uint8Array(buffer, 0, countBytesY),
			bytesCb = new Uint8Array(buffer, countBytesY, countBytesColor),
			bytesCr = new Uint8Array(buffer, countBytesY + countBytesColor, countBytesColor),
			processLine,
			strideY = width,
			strideCb = width >> hdec,
			strideCr = width >> hdec;
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
})();
