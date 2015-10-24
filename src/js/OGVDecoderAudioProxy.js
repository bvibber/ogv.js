OGVDecoderAudioProxy = OGVProxyClass({
	loadedMetadata: false,
	audioFormat: null,
	audioBuffer: null
}, {
	init: function(callback) {
		this.proxy('init', [], callback);
	},

	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processAudio: function(data, callback) {
		this.proxy('processAudio', [data], callback, [data]);
	}
});
