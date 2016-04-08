var OGVVersion = __OGV_FULL_VERSION__;

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

  // @fixme make this less awful
	var proxyTypes = {
		OGVDecoderAudioOpus: 'audio',
		OGVDecoderAudioVorbis: 'audio',
		OGVDecoderVideoTheora: 'video',
		OGVDecoderVideoVP8: 'video'
	};
	var proxyInfo = {
		audio: {
			proxy: require('./OGVDecoderAudioProxy.js'),
			worker: 'ogv-worker-audio.js',
		},
		video: {
			proxy: require('./OGVDecoderVideoProxy.js'),
			worker: 'ogv-worker-video.js'
		}
	}

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

	function defaultBase() {
		if (typeof global.window === 'object') {

			// for browser, try to autodetect
			var scriptNodes = document.querySelectorAll('script'),
				regex = /^(?:(.*)\/)ogv(?:-support)?\.js(?:\?|#|$)/,
				path;
			for (var i = 0; i < scriptNodes.length; i++) {
				path = scriptNodes[i].getAttribute('src');
				if (path) {
					matches = path.match(regex);
					if (matches) {
						return matches[1];
					}
				}
			}

		} else {

			// for workers, assume current directory
			// if not a worker, too bad.
			return '';

		}
	}

	var OGVLoader = {
		base: defaultBase(),

		loadClass: function(className, callback, options) {
			options = options || {};
			if (options.worker) {
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
			var proxyType = proxyTypes[className],
				info = proxyInfo[proxyType];

			if (!info) {
				throw new Error('Requested worker for class with no proxy: ' + className);
			}

			var proxyClass = info.proxy,
				workerScript = info.worker;

			var construct = function(options) {
				var worker = new Worker(urlForScript(workerScript));
				return new proxyClass(worker, className, options);
			};
			callback(construct);
		}
	};

	module.exports = OGVLoader;

})();
