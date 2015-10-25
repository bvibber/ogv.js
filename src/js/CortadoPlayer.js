/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
function CortadoTimeRanges(ranges) {
	this.length = ranges.length;
	this.start = function(i) {
		return ranges[i][0];
	};
	this.end = function(i) {
		return ranges[i][1];
	};
	return this;
}

function CortadoPlayer() {
	// Return a magical custom element!
	var self = document.createElement('cortado');
	self.style.display = 'inline-block';
	self.style.position = 'relative';

	function param(name, value) {
		var el = document.createElement('param');
		el.name = name;
		el.value = value;
		return el;
	}

	var applet;
	function createApplet(playImmediately) {
		applet = document.createElement('applet');

		if (src !== '') {
			applet.appendChild(param('url', src));
		}
		if (durationHint > 0) {
			applet.appendChild(param('duration', Math.round(durationHint)));
		}

		if (playImmediately) {
			applet.appendChild(param('autoPlay', 'true'));
		} else {
			applet.appendChild(param('autoPlay', 'false'));
		}

		applet.width = width || videoWidthHint;
		applet.height =  height || videoHeightHint;
		applet.archive = 'lib/cortado.jar?v2';
		applet.code = 'com.fluendo.player.Cortado.class';

		self.appendChild(applet);
	}


	/**
	 * HTMLMediaElement load method
	 */
	self.load = function() {
		if (applet) {
			applet.reset();
		} else {
			applet = createApplet(false);
		}
	};

	/**
	 * HTMLMediaElement canPlayType method
	 */
	self.canPlayType = function(type) {
		// @todo: implement better parsing
		if (type === 'audio/ogg; codecs="vorbis"') {
			return 'probably';
		} else if (type.match(/^audio\/ogg\b/)) {
			return 'maybe';
		} else if (type === 'video/ogg; codecs="theora"') {
			return 'probably';
		} else if (type === 'video/ogg; codecs="theora,vorbis"') {
			return 'probably';
		} else if (type.match(/^video\/ogg\b/)) {
			return 'maybe';
		} else {
			return '';
		}
	};

	/**
	 * HTMLMediaElement play method
	 */
	self.play = function() {
		paused = false;
		if (applet) {
			applet.doPlay();
		} else {
			createApplet(true);
		}
	};

	/**
	 * HTMLMediaElement pause method
	 */
	self.pause = function() {
		paused = true;
		if (applet) {
			applet.doPause();
		}
	};

	/**
	 * HTMLMediaElement src property
	 */
	var src = "";
	Object.defineProperty(self, "src", {
		get: function getSrc() {
			return src;
		},
		set: function setSrc(val) {
			src = val;
			if (applet) {
				// fixme update the parameter
				applet.reset();
			}
		}
	});

	/**
	 */
	Object.defineProperty(self, "buffered", {
		get: function getBuffered() {
			// not implemented
			return new CortadoTimeRanges([]);
		}
	});

	/**
	 * HTMLMediaElement currentTime property
	 */
	Object.defineProperty(self, "currentTime", {
		get: function getCurrentTime() {
			if (applet && applet.getPlaybackPosition) {
				return applet.getPlaybackPosition();
			} else {
				return 0;
			}
		}
	});

	/**
	 * custom durationHint property
	 */
	var durationHint = null;
	Object.defineProperty(self, "durationHint", {
		get: function getDurationHint() {
			return durationHint;
		},
		set: function setDurationHint(val) {
			durationHint = val;
		}
	});

	/**
	 * HTMLMediaElement duration property
	 */
	Object.defineProperty(self, "duration", {
		get: function getDuration() {
			return durationHint;
		}
	});

	/**
	 * HTMLMediaElement paused property
	 */
	var paused = true;
	Object.defineProperty(self, "paused", {
		get: function getPaused() {
			return paused;
		}
	});

	/**
	 * HTMLMediaElement ended property
	 */
	Object.defineProperty(self, "ended", {
		get: function getEnded() {
			// not implemented
			return false;
		}
	});

	/**
	 * HTMLMediaElement muted property
	 */
	var muted;
	Object.defineProperty(self, "muted", {
		get: function getMuted() {
			return muted;
		},
		set: function setMuted(val) {
			muted = val;
			// todo: is this possible?
		}
	});

	/**
	 * HTMLVideoElement poster property
	 */
	var poster;
	Object.defineProperty(self, "poster", {
		get: function getPoster() {
			return poster;
		},
		set: function setPoster(val) {
			poster = val;
			// todo: implement
		}
	});

	// Video metadata properties...
	var videoWidthHint = 0;
	Object.defineProperty(self, "videoWidth", {
		get: function getVideoWidth() {
			return videoWidthHint;
		}
	});
	var videoHeightHint = 0;
	Object.defineProperty(self, "videoHeight", {
		get: function getVideoHeight() {
			return videoHeightHint;
		}
	});

	// Display size...
	var width = 0, height = 0;
	Object.defineProperty(self, "width", {
		get: function getWidth() {
			return width;
		},
		set: function setWidth(val) {
			width = parseInt(val, 10);
			if (applet) {
				applet.width = width;
			}
		}
	});

	Object.defineProperty(self, "height", {
		get: function getHeight() {
			return height;
		},
		set: function setHeight(val) {
			height = parseInt(val, 10);
			if (applet) {
				applet.height = height;
			}
		}
	});

	// Events!
	// not implemented at this time

	/**
	 * Called when all metadata is available.
	 * Note in theory we must know 'duration' at this point.
	 */
	self.onloadedmetadata = null;

	/**
	 * Called when we start playback
	 */
	self.onplay = null;

	/**
	 * Called when we get paused
	 */
	self.onpause = null;

	/**
	 * Called when playback ends
	 */
	self.onended = null;

	return self;
}

