let OGVCompat = new class {
	hasTypedArrays() {
		// obsolete, kept only for back-compat
		// emscripten-compiled code requires typed arrays
		return !!window.Uint32Array;
	}

	hasWebAssembly() {
		return !!window.WebAssembly;
	}

	hasWebAudio() {
		return !!(window.AudioContext || window.webkitAudioContext);
	}

	hasFlash() {
		// obsolete, kept only for back-compat
		return false;
	}

	hasAudio() {
		return this.hasWebAudio();
	}

	isBlacklisted(userAgent) {
		// obsolete, kept only for back-compat
		return false;
	}

	isSlow() {
		// obsolete, kept only for back-compat
		return false;
	}

	isTooSlow() {
		// obsolete, kept only for back-compat
		return false;
	}

	supported(component) {
		if (component === 'OGVDecoder') {
			return this.hasWebAssembly();
		}
		if (component === 'OGVPlayer') {
			return this.supported('OGVDecoder') && this.hasAudio();
		}
		return false;
	}
};

export default OGVCompat;
