OGVDecoderVideoProxy = OGVProxyClass({
	loadedMetadata: false,
	videoFormat: null,
	frameBuffer: null
}, {
	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processFrame: function(data, callback) {
		this.proxy('processFrame', [data], callback, [data]);
	}
});
