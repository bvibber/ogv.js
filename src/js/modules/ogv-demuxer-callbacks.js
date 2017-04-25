/* global LibraryManager */
/* global mergeInto */
/* global Module */
mergeInto(LibraryManager.library, {

	ogv_init_video: function(codecStr,
		                                 frameWidth, frameHeight,
	                                    chromaWidth, chromaHeight,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module.video = new OGVTrackInfo({
			type: 'video',
			codec: Module.Pointer_stringify(codecStr),
			format: {
				width: frameWidth,
				height: frameHeight,
				chromaWidth: chromaWidth,
				chromaHeight: chromaHeight,
				cropLeft: picX,
				cropTop: picY,
				cropWidth: picWidth,
				cropHeight: picHeight,
				displayWidth: displayWidth,
				displayHeight: displayHeight,
				fps: fps
			}
		});
	},

	ogv_init_audio: function(codecStr, channels, rate) {
		Module.audio = new OGVTrackInfo({
			type: 'audio',
			codec: Module.Pointer_stringify(codecStr),
			format: {
				channels: channels,
				rate: rate
			}
		});
	},

	ogv_init_loaded: function() {
		var len = Module._ogv_demuxer_media_duration();
		if (len >= 0) {
			Module.duration = len;
		} else {
			Module.duration = NaN;
		}

		Module.loaded = true;
	},

	ogv_video_packet: function(buffer, len, frameTimestamp, keyframeTimestamp, isKeyframe) {
		// Note IE 10 doesn't have ArrayBuffer.slice
		Module.videoPackets.push({
			data: Module.HEAPU8.buffer.slice
				? Module.HEAPU8.buffer.slice(buffer, buffer + len)
				: (new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, buffer, len))).buffer,
			timestamp: frameTimestamp,
			keyframeTimestamp: keyframeTimestamp,
			keyframe: !!isKeyframe
		});
	},

	ogv_audio_packet: function(buffer, len, audioTimestamp) {
		// Note IE 10 doesn't have ArrayBuffer.prototype.slice
		Module.audioPackets.push({
			data: Module.HEAPU8.buffer.slice
				? Module.HEAPU8.buffer.slice(buffer, buffer + len)
				: (new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, buffer, len))).buffer,
			timestamp: audioTimestamp
		});
	},

	ogv_promise_resolve: function() {
		var resolve = Module.promiseCallbacks.resolve;
		Module.promiseCallbacks = null;
		resolve();
	},

	ogv_promise_reject: function(errPtr) {
		var reject = Module.promiseCallbacks.reject;
		Module.promiseCallbacks = null;
		reject(new Error(Module.Pointer_stringify(errPtr)));
	},

	ogv_input_eof: function() {
		return Module.stream.eof ? 1 : 0;
	},

	ogv_input_seekable: function() {
		return Module.stream.seekable ? 1 : 0;
	},

	ogv_input_offset: function() {
		var offset = Module.stream.offset;
		var offsetLow = offset & 0xffffffff;
		var offsetHigh = offset - offsetLow;
		Module.Runtime.setTempRet0(offsetHigh);
		return offsetLow;
	},

	ogv_input_bytes_available: function(max) {
		return Module.stream.bytesAvailable(max);
	},

	ogv_input_read_bytes(bufferPtr, len) {
		var dest = Module.HEAPU8.subarray(bufferPtr, bufferPtr + len);
		var nbytes = Module.stream.readBytes(dest);
		return nbytes;
	},

	ogv_input_peek_bytes(bufferPtr, len) {
		var dest = Module.HEAPU8.subarray(bufferPtr, bufferPtr + len);
		var nbytes = Module.stream.peekBytes(dest);
		return nbytes;
	},

	ogv_input_buffer: function(nbytes, callbackPtr) {
		Module.stream.buffer(nbytes).then(function() {
			Module.Runtime.dynCall('vv', callbackPtr, []);
		}).catch(function(err) {
			var reject = Module.promiseCallbacks.reject;
			Module.promiseCallbacks = null;
			reject(err);
		});
	},

	ogv_input_seek: function(offsetLow, offsetHigh) {
		var offset = Module.Runtime.makeBigInt(offsetLow, offsetHigh, false);
		Module.stream.seek(offset);
	}

});
