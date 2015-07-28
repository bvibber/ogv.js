mergeInto(LibraryManager.library, {
	
	ogvjs_callback_loaded_metadata: function(videoCodecStr, audioCodecStr) {
		console.log('ogvjs_callback_loaded_metadata');

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

	ogvjs_callback_video_packet: function(buffer, len, frameTimestamp, keyframeTimestamp) {
		Module.videoPackets.push({
			data: Module.HEAPU8.buffer.slice(buffer, buffer + len),
			timestamp: frameTimestamp,
			keyframeTimestamp: keyframeTimestamp
		});
	},

	ogvjs_callback_audio_packet: function(buffer, len, audioTimestamp) {
		Module.audioPackets.push({
			data: Module.HEAPU8.buffer.slice(buffer, buffer + len),
			timestamp: audioTimestamp
		});
	},

	ogvjs_callback_frame_ready: function() {
		return (Module.videoPackets.length > 0) ? 1 : 0;
	},

	ogvjs_callback_audio_ready: function() {
		return (Module.audioPackets.length > 0) ? 1 : 0;
	}

});
