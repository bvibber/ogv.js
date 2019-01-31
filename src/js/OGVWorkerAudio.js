import OGVWorkerSupport from './OGVWorkerSupport.js';

let proxy = new OGVWorkerSupport([
	'loadedMetadata',
	'audioFormat',
	'audioBuffer',
	'cpuTime'
], {
	init: function(_args, callback) {
		this.target.init(callback);
	},

	processHeader: function(args, callback) {
		this.target.processHeader(args[0], (ok) => {
			callback([ok]);
		});
	},

	processAudio: function(args, callback) {
		this.target.processAudio(args[0], (ok) => {
			callback([ok]);
		});
	}
});

export default proxy;
