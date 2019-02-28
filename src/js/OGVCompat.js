import BogoSlow from './BogoSlow.js';

let OGVCompat = new class {
	constructor() {
		this.benchmark = new BogoSlow();
	}

	hasTypedArrays() {
		// emscripten-compiled code requires typed arrays
		return !!window.Uint32Array;
	}

	hasWebAudio() {
		return !!(window.AudioContext || window.webkitAudioContext);
	}

	hasFlash() {
		if (navigator.userAgent.indexOf('Trident') !== -1) {
			// We only do the ActiveX test because we only need Flash in
			// Internet Explorer 10/11. Other browsers use Web Audio directly
			// (Edge, Safari) or native playback, so there's no need to test
			// other ways of loading Flash.
			try {
				let obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				return true;
			} catch(e) {
				return false;
			}
		}
		return false;
	}

	hasAudio() {
		return this.hasWebAudio() || this.hasFlash();
	}

	isBlacklisted(userAgent) {
		// JIT bugs in old Safari versions
		let blacklist = [
			/\(i.* OS [6789]_.* like Mac OS X\).* Mobile\/.* Safari\//,
			/\(Macintosh.* Version\/6\..* Safari\/\d/
		];
		let blacklisted = false;
		blacklist.forEach((regex) => {
			if (userAgent.match(regex)) {
				blacklisted = true;
			}
		});
		return blacklisted;
	}

	isSlow() {
		return this.benchmark.slow;
	}

	isTooSlow() {
		return this.benchmark.tooSlow;
	}

	supported(component) {
		if (component === 'OGVDecoder') {
			return (this.hasTypedArrays() && !this.isBlacklisted(navigator.userAgent));
		}
		if (component === 'OGVPlayer') {
			return (this.supported('OGVDecoder') && this.hasAudio() && !this.isTooSlow());
		}
		return false;
	}
};

export default OGVCompat;
