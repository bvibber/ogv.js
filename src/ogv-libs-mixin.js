mergeInto(LibraryManager.library, {
	OgvJsOutputFrame: function(bufferY, strideY,
	                           bufferCb, strideCb,
	                           bufferCr, strideCr,
	                           width, height,
	                           hdec, vdec) {
		// YCbCr whee
		console.log('OgvJsOutputFrame', bufferY, strideY, bufferCb, strideCb, bufferCr, strideCr, width, height, hdec, vdec);
		
		var HEAPU8 = Module.HEAPU8;
		var canvas = document.querySelector('canvas');
		var ctx = canvas.getContext('2d');
		var imageData = ctx.createImageData(width, height);
		var data = imageData.data;
		var YPtr, CbPtr, CrPtr, outPtr;
		var xdec, ydec;
		var colorY, colorCb, colorCr;
		var t1, t2, t3, t4;
		var r, g, b;
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
				
				/*
				// Grayscale :)
				data[outPtr++] = colorY;
				data[outPtr++] = colorY;
				data[outPtr++] = colorY;
				data[outPtr++] = 255;
				*/
				
				// Quickie YUV conversion
				// adapted from Cortado :)
				t1 = 298 * (colorY - 16);
				t2 = 409 * colorCr - 309*128 + 128;
				t3 = (100 * colorCb) + (208 * colorCr) - 100*128 - 208*128 - 128;
				t4 = 516 * colorCb - 516*128 + 128;
				
				r = (t1 + t2);
				g = (t1 - t3);
				b = (t1 + t4);
				
				data[outPtr++] = r >> 8; // assuming the array clamps; is that right?
				data[outPtr++] = g >> 8;
				data[outPtr++] = b >> 8;
				data[outPtr++] = 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}
});
