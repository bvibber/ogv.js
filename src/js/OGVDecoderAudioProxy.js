var OGVProxyClass = require('./OGVProxyClass.js');

var OGVDecoderAudioProxy = OGVProxyClass({
	loadedMetadata: false,
	audioFormat: null,
	audioBuffer: null,
	cpuTime: 0
}, {
	init: function(callback) {
		this.proxy('init', [], callback);
	},

	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processAudio: function(data, callback) {
		this.proxy('processAudio', [data], callback, [data]);
	},

	close: function() {
		this.terminate();
	}
});

module.exports = OGVDecoderAudioProxy;
