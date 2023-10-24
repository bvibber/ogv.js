const OGVVersion = __OGV_FULL_VERSION__;

import WebAssemblyCheck from './WebAssemblyCheck.js';

const scriptMap = {
	OGVDemuxerOgg: 'ogv-demuxer-ogg.js',
	OGVDemuxerWebM: 'ogv-demuxer-webm.js',
	OGVDecoderAudioOpus: 'ogv-decoder-audio-opus.js',
	OGVDecoderAudioVorbis: 'ogv-decoder-audio-vorbis.js',
	OGVDecoderVideoTheora: 'ogv-decoder-video-theora.js',
	OGVDecoderVideoTheoraSIMD: 'ogv-decoder-video-theora-simd.js',
	OGVDecoderVideoVP8: 'ogv-decoder-video-vp8.js',
	OGVDecoderVideoVP8SIMD: 'ogv-decoder-video-vp8-simd.js',
	OGVDecoderVideoVP9: 'ogv-decoder-video-vp9.js',
	OGVDecoderVideoVP9SIMD: 'ogv-decoder-video-vp9-simd.js',
	OGVDecoderVideoVP9SIMDMT: 'ogv-decoder-video-vp9-simd-mt.js',
	OGVDecoderVideoAV1: 'ogv-decoder-video-av1.js',
	OGVDecoderVideoAV1SIMD: 'ogv-decoder-video-av1-simd.js',
	OGVDecoderVideoAV1MT: 'ogv-decoder-video-av1-mt.js',
	OGVDecoderVideoAV1SIMDMT: 'ogv-decoder-video-av1-simd-mt.js',
};

class OGVLoaderBase {
	constructor() {
		this.base = this.defaultBase();
	}

	defaultBase() {
		return undefined;
	}

	wasmSupported() {
		return WebAssemblyCheck.wasmSupported();
	}

	scriptForClass(className) {
		return scriptMap[className];
	}

	urlForClass(className) {
		let scriptName = this.scriptForClass(className);
		if (scriptName) {
			return this.urlForScript(scriptName);
		} else {
			throw new Error('asked for URL for unknown class ' + className);
		}
	}

	urlForScript(scriptName) {
		if (scriptName) {
			let base = this.base;
			if (base === undefined) {
				base = '';
			} else {
				base += '/';
			}
			return base + scriptName + '?version=' + encodeURIComponent(OGVVersion);
		} else {
			throw new Error('asked for URL for unknown script ' + scriptName);
		}
	}

	loadClass(className, callback, options) {
		options = options || {};
		let global = this.getGlobal();
		let url = this.urlForClass(className);
		let classWrapper = (options) => {
			options = options || {};
			options.locateFile = (filename) => {
				// Allow secondary resources like the .wasm payload
				// to be loaded by the emscripten code.
				if (filename.slice(0, 5) === 'data:') {
					// emscripten 1.37.25 loads memory initializers as data: URI
					return filename;
				} else {
					return this.urlForScript(filename);
				}
			};
			options.mainScriptUrlOrBlob = this.scriptForClass(className) + '?version=' + encodeURIComponent(OGVVersion);
			// Note: these pseudoclasses should not use 'new',
			// which breaks in emscripten 1.38.10
			return global[className](options);
		}
		if (typeof global[className] === 'function') {
			// already loaded!
			callback(classWrapper);
		} else {
			this.loadScript(url, () => {
				callback(classWrapper);
			});
		}
	}
}

export default OGVLoaderBase;
