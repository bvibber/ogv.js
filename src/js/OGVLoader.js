var OGVVersion = __OGV_FULL_VERSION__;

(function() {
	var global = this;

	var scriptMap = {
		OGVDemuxerOgg: 'ogv-demuxer-ogg.js',
		OGVDemuxerOggW: 'ogv-demuxer-ogg-wasm.js',
		OGVDemuxerWebM: 'ogv-demuxer-webm.js',
		OGVDemuxerWebMW: 'ogv-demuxer-webm-wasm.js',
		OGVDecoderAudioOpus: 'ogv-decoder-audio-opus.js',
		OGVDecoderAudioOpusW: 'ogv-decoder-audio-opus-wasm.js',
		OGVDecoderAudioVorbis: 'ogv-decoder-audio-vorbis.js',
		OGVDecoderAudioVorbisW: 'ogv-decoder-audio-vorbis-wasm.js',
		OGVDecoderVideoTheora: 'ogv-decoder-video-theora.js',
		OGVDecoderVideoTheoraW: 'ogv-decoder-video-theora-wasm.js',
		OGVDecoderVideoVP8: 'ogv-decoder-video-vp8.js',
		OGVDecoderVideoVP8W: 'ogv-decoder-video-vp8-wasm.js',
		OGVDecoderVideoVP8MT: 'ogv-decoder-video-vp8-mt.js',
		OGVDecoderVideoVP9: 'ogv-decoder-video-vp9.js',
		OGVDecoderVideoVP9W: 'ogv-decoder-video-vp9-wasm.js',
		OGVDecoderVideoVP9MT: 'ogv-decoder-video-vp9-mt.js'
	};

  // @fixme make this less awful
	var proxyTypes = {
		OGVDecoderAudioOpus: 'audio',
		OGVDecoderAudioOpusW: 'audio',
		OGVDecoderAudioVorbis: 'audio',
		OGVDecoderAudioVorbisW: 'audio',
		OGVDecoderVideoTheora: 'video',
		OGVDecoderVideoTheoraW: 'video',
		OGVDecoderVideoVP8: 'video',
		OGVDecoderVideoVP8W: 'video',
		OGVDecoderVideoVP9: 'video',
		OGVDecoderVideoVP9W: 'video'
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
			if (base === undefined) {
				base = '';
			} else {
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
				regex = /^(?:|(.*)\/)ogv(?:-support)?\.js(?:\?|#|$)/,
				path,
				matches;
			for (var i = 0; i < scriptNodes.length; i++) {
				path = scriptNodes[i].getAttribute('src');
				if (path) {
					matches = path.match(regex);
					if (matches) {
						return matches[1];
					}
				}
			}

			return undefined; // current dir

		} else {

			// for workers, assume current directory
			// if not a worker, too bad.
			return undefined;

		}
	}

	var OGVLoader = {
		base: defaultBase(),

		loadClass: function(className, callback, options) {
			options = options || {};
			if (options.worker) {
				this.workerProxy(className, callback);
				return;
			}
			var url = urlForClass(className);
			function classWrapper(options) {
				options = options || {};
				options.locateFile = function(filename) {
					// Allow secondary resources like the .wasm payload
					// to be loaded by the emscripten code.
					return urlForScript(filename);
				};
				return new global[className](options);
			}
			if (typeof global[className] === 'function') {
				// already loaded!
				callback(classWrapper);
			} else if (typeof global.window === 'object') {
				loadWebScript(url, function() {
					callback(classWrapper);
				});
			} else if (typeof global.importScripts === 'function') {
				// worker has convenient sync importScripts
				global.importScripts(url);
				callback(classWrapper);
			}
		},

		workerProxy: function(className, callback) {
			var proxyType = proxyTypes[className],
				info = proxyInfo[proxyType];

			if (!info) {
				throw new Error('Requested worker for class with no proxy: ' + className);
			}

			var proxyClass = info.proxy,
				workerScript = info.worker,
				codecUrl = urlForScript(scriptMap[className]),
				workerUrl = urlForScript(workerScript),
				worker;

			var construct = function(options) {
				return new proxyClass(worker, className, options);
			};

			if (workerUrl.match(/^https?:|\/\//i)) {
				// Can't load workers natively cross-domain, but if CORS
				// is set up we can fetch the worker stub and the desired
				// class and load them from a blob.
				var getCodec,
					getWorker,
					codecResponse,
					workerResponse,
					codecLoaded = false,
					workerLoaded = false,
					blob;

				function completionCheck() {
					if ((codecLoaded == true) && (workerLoaded == true)) {
						try {
							blob = new Blob([codecResponse + " " + workerResponse], {type: 'application/javascript'});
						} catch (e) { // Backwards-compatibility
							window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
							blob = new BlobBuilder();
							blob.append(codecResponse + " " + workerResponse);
							blob = blob.getBlob();
						}
						// Create the web worker
						worker = new Worker(URL.createObjectURL(blob));
						callback(function(options) {
							return Promise.resolve(new construct(options));
						})
					}
				}

				// Load the codec
				getCodec = new XMLHttpRequest();
				getCodec.open("GET", codecUrl, true);
				getCodec.onreadystatechange = function() {
					if(getCodec.readyState == 4 && getCodec.status == 200) {
						codecResponse = getCodec.responseText;
						// Update the codec response loaded flag
						codecLoaded = true;
						completionCheck();
					}
				};
				getCodec.send();

				// Load the worker
				getWorker = new XMLHttpRequest();
				getWorker.open("GET", workerUrl, true);
				getWorker.onreadystatechange = function() {
					if(getWorker.readyState == 4 && getWorker.status == 200) {
						workerResponse = getWorker.responseText;
						// Update the worker response loaded flag
						workerLoaded = true;
						completionCheck();
					}
				};
				getWorker.send();
			} else {
				// Local URL; load it directly for simplicity.
				worker = new Worker(workerUrl);
				callback(function(options) {
					return Promise.resolve(new construct(options));
				})
			}
		}
	};

	module.exports = OGVLoader;

})();
