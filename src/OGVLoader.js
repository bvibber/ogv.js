(function() {
	var global = this;

	var scriptMap = {
		OGVDemuxerOgg: 'ogv-demuxer-ogg.js',
		OGVDemuxerWebM: 'ogv-demuxer-webm.js',
		OGVDecoderAudioOpus: 'ogv-decoder-audio-opus.js',
		OGVDecoderAudioVorbis: 'ogv-decoder-audio-vorbis.js',
		OGVDecoderVideoTheora: 'ogv-decoder-video-theora.js',
		OGVDecoderVideoVP8: 'ogv-decoder-video-vp8.js'
	};

	var proxyMap = {
		OGVDecoderAudioOpus: 'OGVDecoderAudioProxy',
		OGVDecoderAudioVorbis: 'OGVDecoderAudioProxy',
		OGVDecoderVideoTheora: 'OGVDecoderVideoProxy',
		OGVDecoderVideoVP8: 'OGVDecoderVideoProxy'
	};
	var workerMap = {
		OGVDecoderAudioProxy: 'ogv-worker-audio.js',
		OGVDecoderVideoProxy: 'ogv-worker-video.js'
	};

	function urlForClass(className) {
		var scriptName = scriptMap[className];
		if (scriptName) {
			return urlForScript(scriptName);
		} else {
			throw new Error('asked for URL for unknown class ' + className);
		}
	};

	function urlForScript(scriptName) {
		if (scriptName) {
			var base = OGVLoader.base;
			if (base) {
				base += '/';
			}
			return base + scriptName + '?version=' + encodeURIComponent(OGVVersion);
		} else {
			throw new Error('asked for URL for unknown script ' + scriptName);
		}
	};

	var scriptStatus = {},
		scriptCallbacks = {};
	function loadWebScript(src, callback) {
		console.log('loading web js', src);
		if (scriptStatus[src] == 'done') {
			callback();
		} else if (scriptStatus[src] == 'loading') {
			scriptCallbacks[src].push(callback);
		} else {
			scriptStatus[src] = 'loading';
			scriptCallbacks[src] = [callback];

			var scriptNode = document.createElement('script');
			function done(event) {
				var callbacks = scriptCallbacks[src];
				delete scriptCallbacks[src];
				scriptStatus[src] = 'done';

				callbacks.forEach(function(cb) {
					cb();
				});
			}
			scriptNode.addEventListener('load', done);
			scriptNode.addEventListener('error', done);
			scriptNode.src = src;
			document.querySelector('head').appendChild(scriptNode);
		}
	}

	OGVLoader = {
		base: '',

		loadClass: function(className, callback, options) {
			options = options || {};
			if (options.worker && typeof global.Worker === 'function') {
				this.workerProxy(className, callback);
			} else if (typeof global[className] === 'function') {
				// already loaded!
				callback(global[className]);
			} else if (typeof global.window === 'object') {
				loadWebScript(urlForClass(className), function() {
					callback(global[className]);
				});
			} else if (typeof global.importScripts === 'function') {
				// worker has convenient sync importScripts
				global.importScripts(urlForClass(className));
				callback(global[className]);
			}
		},

		workerProxy: function(className, callback) {
			var proxyClass = proxyMap[className],
				workerScript = workerMap[proxyClass];

			if (!proxyClass) {
				throw new Error('Requested worker for class with no proxy: ' + className);
			}
			if (!workerScript) {
				throw new Error('Requested worker for class with no worker: ' + className);
			}

			this.loadClass(proxyClass, function(classObj) {
				var construct = function(options) {
					var worker = new Worker(urlForScript(workerScript));
					return new classObj(worker, className, options);
				};
				callback(construct);
			});
		}
	};
})();
