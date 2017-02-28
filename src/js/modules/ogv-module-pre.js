/* global Module:true */
/* global options:true */

// Keep decoder options separate from emscripten module options
var options = Module;
Module = {
	print: function(str) {
		console.log(str);
	}
};
if (options['memoryLimit']) {
	Module['TOTAL_MEMORY'] = options['memoryLimit'];
}

// hack for https://github.com/brion/ogv.js/issues/448
var OGVDemuxerOgg = Module;
var OGVDemuxerWebM = Module;
var OGVDecoderVideoTheora = Module;
var OGVDecoderVideoVP8 = Module;
var OGVDecoderVideoVP9 = Module;
var OGVDecoderAudioVorbis = Module;
var OGVDecoderAudioOpus = Module;
