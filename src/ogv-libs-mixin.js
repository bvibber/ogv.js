mergeInto(LibraryManager.library, {
	OgvJsOutputFrame: function(bufferY, strideY,
	                           bufferCb, strideCb,
	                           bufferCr, strideCr,
	                           width, height,
	                           hdec, vdec) {
		// YCbCr whee
		console.log('OgvJsOutputFrame', bufferY, strideY, bufferCb, strideCb, bufferCr, strideCr, width, height, hdec, vdec);
		
		var canvas = document.querySelector('canvas');
		var ctx = canvas.getContext('2d');
		var imageData = ctx.createImageData(width, height);
		var data = imageData.data;
		var inPtr, outPtr;
		for (var y = 0; y < height; y++) {
			var inPtr = bufferY + y * strideY;
			var outPtr = y *4 * width;
			for (var x = 0; x < width; x++) {
				// quick grayscale conversion
				var colorY = Module.HEAPU8[inPtr++];
				data[outPtr++] = colorY;
				data[outPtr++] = colorY;
				data[outPtr++] = colorY;
				data[outPtr++] = 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}
});
