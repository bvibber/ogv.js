mergeInto(LibraryManager.library, {
	OgvJsOutputFrame: function(bufferY, strideY,
	                           bufferCb, strideCb,
	                           bufferCr, strideCr,
	                           width, height,
	                           hdec, vdec) {
		// YCbCr whee
		console.log('OgvJsOutputFrame', bufferY, strideY, bufferCb, strideCb, bufferCr, strideCr, width, height, hdec, vdec);
	}
});
