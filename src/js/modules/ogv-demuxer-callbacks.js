/* global LibraryManager */
/* global mergeInto */
/* global Module */
mergeInto(LibraryManager.library, {

	ogvjs_callback_init_video: function(frameWidth, frameHeight,
	                                    chromaWidth, chromaHeight,
                                        fps,
                                        picWidth, picHeight,
                                        picX, picY,
                                        displayWidth, displayHeight) {
		Module.videoFormat = {
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
		};
	},

	ogvjs_callback_init_audio: function(channels, rate) {
		Module.audioFormat = {
			channels: channels,
			rate: rate
		};
	},

	ogvjs_callback_loaded_metadata: function(videoCodecStr, audioCodecStr) {
		if (videoCodecStr) {
			Module.videoCodec = Module.Pointer_stringify(videoCodecStr);
		}
		if (audioCodecStr) {
			Module.audioCodec = Module.Pointer_stringify(audioCodecStr);
		}

		var len = Module._ogv_demuxer_media_duration();
		if (len >= 0) {
			Module.duration = len;
		} else {
			Module.duration = NaN;
		}

		Module.loadedMetadata = true;
	},

	ogvjs_callback_video_packet: function(buffer, len, frameTimestamp, keyframeTimestamp, isKeyframe) {
		// Note IE 10 doesn't have ArrayBuffer.slice
		Module.videoPackets.push({
			data: Module.HEAPU8.buffer.slice
				? Module.HEAPU8.buffer.slice(buffer, buffer + len)
				: (new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, buffer, len))).buffer,
			timestamp: frameTimestamp,
			keyframeTimestamp: keyframeTimestamp,
			isKeyframe: !!isKeyframe
		});
	},

	ogvjs_callback_audio_packet: function(buffer, len, audioTimestamp) {
		// Note IE 10 doesn't have ArrayBuffer.slice
		Module.audioPackets.push({
			data: Module.HEAPU8.buffer.slice
				? Module.HEAPU8.buffer.slice(buffer, buffer + len)
				: (new Uint8Array(new Uint8Array(Module.HEAPU8.buffer, buffer, len))).buffer,
			timestamp: audioTimestamp
		});
	},

	ogvjs_callback_frame_ready: function() {
		return (Module.videoPackets.length > 0) ? 1 : 0;
	},

	ogvjs_callback_audio_ready: function() {
		return (Module.audioPackets.length > 0) ? 1 : 0;
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

	ogv_input_buffer: function(nbytes, callbackPtr) {
		Module.stream.buffer(nbytes).then(function(available) {
			Module.Runtime.dynCall('vi', callbackPtr, [available]);
		});
	},

	ogv_input_seek: function(offsetLow, offsetHigh) {
		var offset = Module.Runtime.makeBigInt(offsetLow, offsetHigh, true);
		Module.stream.seek(offset);
	}

});
