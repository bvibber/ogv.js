/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
function OgvSwfTimeRanges(ranges) {
	// note: can't use Object.defineProperty on non-DOM objects in IE 8
	this.length = ranges.length;
	this.start = function(i) {
		return ranges[i][0];
	};
	this.end = function(i) {
		return ranges[i][1];
	}
	return this;
}

function OgvSwfPlayer() {
	// Return a magical custom element!
	var self = document.createElement('ogvswf');
	self.style.display = 'inline-block';
	self.style.position = 'relative';
	
	var idkey = OgvSwfPlayer.nextId++,
		callbackName = 'ogvSwfFlashCallback' + idkey,
		validCallbacks = [
			'onframecallback',
			'onplay',
			'onpause',
			'onended',
			'ontrace',
			'onloadedmetadata'
		];
	self.ontrace = function(str) {
		console.log('Flash: ' + str);
	};
	
	// Register a global function for callbacks. :P
	window[callbackName] = function ogvSwfFlashCallback(eventName, args) {
		// Array.indexOf doesn't exist in IE until 9!
		var legit = false;
		for (var i = 0; i < validCallbacks.length; i++) {
			if (eventName === validCallbacks[i]) {
				legit = true;
				break;
			}
		}
		if (legit && self[eventName]) {
			self[eventName](args);
		}
	};
	
	function param(name, value) {
		var el = document.createElement('param');
		el.name = name;
		el.value = value;
		return el;
	}
	
	var swfUrl = 'lib/ogv.swf?buildDate=' + encodeURIComponent(OgvSwfPlayer.buildDate);

	var flash = document.createElement('object');
	flash.id = 'ogvswf-flashelement-' + idkey;
	flash.width = 320;
	flash.height = 240;
	flash.appendChild(param('allowscriptaccess', 'always'));
	flash.appendChild(param('flashVars', 'jsCallbackName=' + callbackName));
	// For IE <= 9:
	if (typeof flash.classid == 'string') {
		flash.appendChild(param('movie', swfUrl));
		flash.appendChild(param('wmode', 'opaque'));
		// Must set all the parameters before setting classid...
		flash.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
	} else {
		// And for everybody else:
		flash.type = 'application/x-shockwave-flash';
	}
	flash.data = swfUrl;

	self.appendChild(flash);
	
	
	var waitingCallbacks = [],
		waitingTimer = null,
		times = 0,
		maxTimes = 100;
	function pingFlashPlugin() {
		waitingTimer = setTimeout(function doPingFlashPlugin() {
			waitingTimer = null;
			times++;
			if (flash._isReady) {
				for (var i = 0; i < waitingCallbacks.length; i++) {
					waitingCallbacks[i]();
				}
				waitingCallbacks = [];
			} else if (times > maxTimes) {
				console.log("Failed to initialize Flash Ogv video player");
			} else {
				console.log('try again...');
				pingFlashPlugin();
			}
		}, 20);
	}
	function waitForFlash(callback) {
		if (flash._isReady) {
			callback();
		} else if (waitingTimer == null) {
			waitingCallbacks.push(callback);
			pingFlashPlugin();
		} else {
			// already waiting
			waitingCallbacks.push(callback);
		}
	}

	/**
	 * @todo can we force this to call automatically on removal?
	 */
	self.destroy = function() {
		window[callbackName] = undefined;
	};
	
	/**
	 * HTMLMediaElement load method
	 */
	self.load = function() {
		waitForFlash(function() {
			flash._load();
		});
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
		waitForFlash(function() {
			flash._play();
		});
	};
	
	/**
	 * custom getPlaybackStats method
	 */
	self.getPlaybackStats = function() {
		if (flash._isReady) {
			return flash._getPlaybackStats();
		} else {
			return {
				framesProcessed: 0,
				demuxingTime: 0,
				videoDecodingTime: 0,
				audioDecodingTime: 0,
				bufferTime: 0,
				colorTime: 0,
				drawingTime: 0,
				droppedAudio: 0,
				jitter: 0
			};
		}
	};
	self.resetPlaybackStats = function() {
		waitForFlash(function() {
			flash._resetPlaybackStats();
		});
	};
	
	/**
	 * HTMLMediaElement pause method
	 */
	self.pause = function() {
		waitForFlash(function() {
			flash._pause();
		});
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
			waitForFlash(function() {
				flash._setSrc(val);
			});
		}
	});
	
	/**
	 */
	Object.defineProperty(self, "buffered", {
		get: function getBuffered() {
			var bufferedTime;
			if (flash._isReady) {
				bufferedTime = flash._getBufferedTime();
			} else {
				bufferedTime = 0;
			}
			return new OgvSwfTimeRanges([[0, bufferedTime]]);
		}
	});
	
	/**
	 * HTMLMediaElement currentTime property
	 */
	Object.defineProperty(self, "currentTime", {
		get: function getCurrentTime() {
			if (flash._isReady) {
				return flash._getCurrentTime();
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
			waitForFlash(function() {
				flash._setDurationHint(durationHint);
			});
		}
	});
	
	/**
	 * custom byteLengthHint property
	 */
	var byteLengthHint = null;
	Object.defineProperty(self, "byteLengthHint", {
		get: function getByteLengthHint() {
			return byteLengthHint;
		},
		set: function setByteLengthHint(val) {
			byteLengthHint = val;
			waitForFlash(function() {
				flash._setByteLengthHint(byteLengthHint);
			});
		}
	});
	
	/**
	 * HTMLMediaElement duration property
	 */
	Object.defineProperty(self, "duration", {
		get: function getDuration() {
			if (flash._isReady) {
				return flash._getDuration();
			} else {
				return 0;
			}
		}
	});
	
	/**
	 * HTMLMediaElement paused property
	 */
	Object.defineProperty(self, "paused", {
		get: function getPaused() {
			if (flash._isReady) {
				return flash._getPaused();
			} else {
				return true;
			}
		}
	});
	
	/**
	 * HTMLMediaElement ended property
	 */
	Object.defineProperty(self, "ended", {
		get: function getEnded() {
			if (flash._isReady) {
				return flash._getEnded();
			} else {
				return false;
			}
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
			waitForFlash(function() {
				flash._setMuted(val);
			});
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
			waitForFlash(function() {
				flash._setPoster(val);
			});
		}
	});
	
	// Video metadata properties...
	Object.defineProperty(self, "videoWidth", {
		get: function getVideoWidth() {
			if (flash._isReady) {
				return flash._getVideoWidth();
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "videoHeight", {
		get: function getVideoHeight() {
			if (flash._isReady) {
				return flash._getVideoHeight();
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "ogvjsVideoFrameRate", {
		get: function getOgvJsVideoFrameRate() {
			if (flash._isReady) {
				return flash._getFrameRate();
			} else {
				return 0;
			}
		}
	});
	
	// Audio metadata properties...
	Object.defineProperty(self, "ogvjsAudioChannels", {
		get: function getOgvJsAudioChannels() {
			if (flash._isReady) {
				return flash._getAudioChannels();
			} else {
				return 0;
			}
		}
	});
	Object.defineProperty(self, "ogvjsAudioSampleRate", {
		get: function getOgvJsAudioChannels() {
			if (flash._isReady) {
				return flash._getAudioSampleRate();
			} else {
				return 0;
			}
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
			flash.width = width;
		}
	});
	
	Object.defineProperty(self, "height", {
		get: function getHeight() {
			return height;
		},
		set: function setHeight(val) {
			height = parseInt(val, 10);
			flash.height = height;
		}
	});

	// Events!

	/**
	 * custom onframecallback, takes frame decode time in ms
	 */
	self.onframecallback = null;
	
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

OgvSwfPlayer.nextId = 1;
