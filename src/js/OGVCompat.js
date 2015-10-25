var BogoSlow = require('./BogoSlow.js');

var OGVCompat = {
	benchmark: new BogoSlow(),

	hasTypedArrays: function() {
		// emscripten-compiled code requires typed arrays
		return !!window.Uint32Array;
	},

	hasWebAudio: function() {
		return !!(window.AudioContext || window.webkitAudioContext);
	},

	hasFlash: function() {
		if (navigator.userAgent.indexOf('Trident') !== -1) {
			// We only do the ActiveX test because we only need Flash in
			// Internet Explorer 10/11. Other browsers use Web Audio directly
			// (Edge, Safari) or native playback, so there's no need to test
			// other ways of loading Flash.
			try {
				var obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				return true;
			} catch(e) {
				return false;
			}
		}
		return false;
	},

	hasAudio: function() {
		return this.hasWebAudio() || this.hasFlash();
	},

	isBlacklisted: function(userAgent) {
		// JIT bugs in old Safari versions
		var blacklist = [
			/\(i.* OS [67]_.* like Mac OS X\).* Mobile\/.* Safari\//,
			/\(Macintosh.* Version\/6\..* Safari\/\d/
		];
		var blacklisted = false;
		blacklist.forEach(function(regex) {
			if (userAgent.match(regex)) {
				blacklisted = true;
			}
		});
		return blacklisted;
	},

	isSlow: function() {
		return this.benchmark.slow;
	},

	isTooSlow: function() {
		return this.benchmark.tooSlow;
	},

	supported: function(component) {
		if (component === 'OGVDecoder') {
			return (this.hasTypedArrays() && !this.isBlacklisted(navigator.userAgent));
		}
		if (component === 'OGVPlayer') {
			return (this.supported('OGVDecoder') && this.hasAudio() && !this.isTooSlow());
		}
		return false;
	}
};

module.exports = OGVCompat;
