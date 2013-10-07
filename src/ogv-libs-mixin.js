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
		for (var y = 0; y < height; y++) {
			for (var x = 0; x < width; x++) {
				// quick grayscale conversion
				var colorY = Module.getValue(bufferY + y * strideY + x, "i8");
				data[y * 4 * width + x * 4] = colorY;
				data[y * 4 * width + x * 4 + 1] = colorY;
				data[y * 4 * width + x * 4 + 2] = colorY;
				data[y * 4 * width + x * 4 + 3] = 255;
			}
		}
		ctx.putImageData(imageData, 0, 0);
	}
});
