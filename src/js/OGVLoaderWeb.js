/* global Promise */
/* global BlobBuilder */

import OGVDecoderAudioProxy from './OGVDecoderAudioProxy.js';
import OGVDecoderVideoProxy from './OGVDecoderVideoProxy.js';
import OGVLoaderBase from './OGVLoaderBase.js';

const proxyInfo = {
	audio: {
		proxy: OGVDecoderAudioProxy,
		worker: 'ogv-worker-audio.js',
	},
	video: {
		proxy: OGVDecoderVideoProxy,
		worker: 'ogv-worker-video.js',
	},
};

// @fixme make this less awful
const proxyTypes = {
	OGVDecoderAudioOpus: 'audio',
	OGVDecoderAudioOpusW: 'audio',
	OGVDecoderAudioVorbis: 'audio',
	OGVDecoderAudioVorbisW: 'audio',
	OGVDecoderVideoTheora: 'video',
	OGVDecoderVideoTheoraW: 'video',
	OGVDecoderVideoVP8: 'video',
	OGVDecoderVideoVP8W: 'video',
	OGVDecoderVideoVP9: 'video',
	OGVDecoderVideoVP9W: 'video',
	OGVDecoderVideoVP9SIMDW: 'video',
	OGVDecoderVideoAV1: 'video',
	OGVDecoderVideoAV1W: 'video',
	OGVDecoderVideoAV1SIMDW: 'video',
};

class OGVLoaderWeb extends OGVLoaderBase {
    constructor() {
        super();
        this.scriptStatus = {};
        this.scriptCallbacks = {};
    }

    getGlobal() {
        return window;
    }

    defaultBase() {
        // for browser, try to autodetect
		let scriptNodes = document.querySelectorAll('script'),
			regex = /^(?:|(.*)\/)ogv(?:-support|-es2017)?\.js(?:\?|#|$)/,
			path,
			matches;
		for (let i = 0; i < scriptNodes.length; i++) {
			path = scriptNodes[i].getAttribute('src');
			if (path) {
				matches = path.match(regex);
				if (matches) {
					return matches[1];
				}
			}
		}

		return undefined; // current dir
	}

    loadClass(className, callback, options) {
		options = options || {};
		if (options.worker) {
			this.workerProxy(className, callback);
		} else {
            super.loadClass(className, callback, options);
        }
    }

    loadScript(src, callback) {
        if (this.scriptStatus[src] == 'done') {
            callback();
        } else if (this.scriptStatus[src] == 'loading') {
            this.scriptCallbacks[src].push(callback);
        } else {
            this.scriptStatus[src] = 'loading';
            this.scriptCallbacks[src] = [callback];

            let scriptNode = document.createElement('script');
            let done = (event) => {
                let callbacks = this.scriptCallbacks[src];
                delete this.scriptCallbacks[src];
                this.scriptStatus[src] = 'done';

                callbacks.forEach((cb) => {
                    cb();
                });
            }
            scriptNode.addEventListener('load', done);
            scriptNode.addEventListener('error', done);
            scriptNode.src = src;
            document.querySelector('head').appendChild(scriptNode);
        }
    }

    workerProxy(className, callback) {
        let proxyType = proxyTypes[className],
            info = proxyInfo[proxyType];

        if (!info) {
            throw new Error('Requested worker for class with no proxy: ' + className);
        }

        let proxyClass = info.proxy,
            workerScript = info.worker,
            codecUrl = this.urlForScript(this.scriptForClass(className)),
            workerUrl = this.urlForScript(workerScript),
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
}

let OGVLoader = new OGVLoaderWeb();

export default OGVLoader;
