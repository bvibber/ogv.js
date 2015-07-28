proxy = new OGVWorkerSupport([
	'loadedMetadata',
	'audioFormat',
	'audioBuffer'
], {
	processHeader: function(args, callback) {
		this.target.processHeader(args[0], function(ok) {
			callback([ok]);
		});
	},

	processAudio: function(args, callback) {
		this.target.processAudio(args[0], function(ok) {
			callback([ok]);
		});
	}
});
