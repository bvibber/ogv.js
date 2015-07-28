OGVDecoderAudioProxy = OGVProxyClass({
	loadedMetadata: false,
	audioFormat: null,
	audioBuffer: null
}, {
	processHeader: function(data, callback) {
		this.proxy('processHeader', [data], callback, [data]);
	},

	processAudio: function(data, callback) {
		this.proxy('processAudio', [data], callback, [data]);
	}
});
