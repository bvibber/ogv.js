function OgvJsShim(options) {
	var self = this;
	var worker = new Worker('lib/ogv-worker.js');

	var queuedFrame = null;
	var audioBuffers = [];

	worker.addEventListener('message', function(event) {
		var data = event.data;
		//console.log('UI got ', data);
		if (data.action == 'oninitvideo') {
			self.hasVideo = true;
			if (self.oninitvideo) {
				self.oninitvideo(data.info);
			}
		} else if (data.action === 'oninitaudio') {
			self.hasAudio = true;
			if (self.oninitaudio) {
				self.oninitaudio(data.info);
			}
		} else if (data.action == 'onprocess') {
			if (data.frame) {
				self.frameReady = true;
				queuedFrame = data.frame;
			}
			if (data.audio) {
				self.audioReady = true;
				for (var i = 0; i < data.audio.length; i++) {
					audioBuffers.push(data.audio[i]);
				}
			}
			if (self.onprocess) {
				var cb = self.onprocess;
				self.onprocess = null;
				cb(data.result);
			}
		}
	});

	/**
	 * @property function({codec, frameWidth, frameHeight, fps, picWidth, picHeight, picX, picY}) event handler when initializing video stream
	 */
	self.oninitvideo = null;

	/**
	 * @property function({codec, channels, rate}) event handler when initializing audio stream
	 */
	self.onaudioinit = null;

	/**
	 * @property boolean does the media stream contain video?
	 */
	self.hasVideo = false;

	/**
	 * @property boolean does the media stream contain audio?
	 */
	self.hasAudio = false;

	/**
	 * @property boolean Have we decoded a frame that's ready to be used?
	 */
	self.frameReady = false;
	
	/**
	 * @property boolean Have we decoded an audio buffer that's ready to be used?
	 */
	self.audioReady = false;
	
	self.init = function(options) {
		worker.postMessage({
			action: 'init',
			options: options
		});
	};
	
	/**
	 * Tear down the instance when done.
	 *
	 * todo: do we need to do something more to destroy the C environment?
	 */
	self.destroy = function() {
		worker.postMessage({
			action: 'destroy'
		});
		worker = null;
	};
	
	/**
	 * Queue up a chunk of input data for later processing.
	 *
	 * @param ArrayBuffer data
	 */
	self.receiveInput = function(data) {
		worker.postMessage({
			action: 'receiveInput',
			data: data
		});
	};
	
	/**
	 * Process the next packet in the stream
	 */
	self.process = function(callback) {
		self.onprocess = callback;
		worker.postMessage({
			action: 'process',
		});
	}
	
	/**
	 * Return the last-decoded frame, if any.
	 *
	 * @return ImageData
	 */
	self.dequeueFrame = function() {
		if (self.frameReady) {
			var frame = queuedFrame;
			queuedFrame = null;
			self.frameReady = false;
			return frame;
		} else {
			throw new Error("called dequeueFrame when no frame ready");
		}
	}

	/**
	 * Return the next decoded audio buffer
	 *
	 * @return array of audio thingies
	 */
	self.dequeueAudio = function() {
		if (self.audioReady) {
			var buffer = audioBuffers.shift();
			self.audioReady = (audioBuffers.length > 0);
			return buffer;
		} else {
			throw new Error("called dequeueAudio when no audio ready");
		}
	}

	/**
	 * Is there processed data to handle?
	 *
	 * @return boolean
	 */	
	self.dataReady = function() {
		if (self.hasVideo) {
			return self.frameReady;
		} else {
			return self.audioReady;
		}
	}
	
	self.init(options);
	
	return this;
}
