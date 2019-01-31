import OGVWorkerSupport from './OGVWorkerSupport.js';

let proxy = new OGVWorkerSupport([
	'loadedMetadata',
	'videoFormat',
	'frameBuffer',
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

	processFrame: function(args, callback) {
		this.target.processFrame(args[0], (ok) => {
			callback([ok]);
		});
	}
});

export default proxy;
