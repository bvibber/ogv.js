var OGVProxyClass = require('./OGVProxyClass.js');

var OGVDecoderVideoProxy = OGVProxyClass({
	loadedMetadata: false,
	videoFormat: null,
	frameBuffer: null,
	cpuTime: 0
}, {
	init: function(callback) {
		this.proxy('init', [], callback);
	},

	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processFrame: function(data, callback) {
		this.proxy('processFrame', [data], callback, [data]);
	},

	close: function() {
		this.terminate();
	}
});

module.exports = OGVDecoderVideoProxy;