OGVDecoderVideoProxy = OGVProxyClass({
	loadedMetadata: false,
	videoFormat: null,
	frameBuffer: null
}, {
	init: function(callback) {
		this.proxy('init', [], callback);
	},

	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processFrame: function(data, callback) {
		this.proxy('processFrame', [data], callback, [data]);
	}
});
