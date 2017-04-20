/* global Module:true */
/* global options:true */

// Keep decoder options separate from emscripten module options
var options = Module;
Module = {
	print: function(str) {
		console.log(str);
	}
};
if (typeof OGVLoader !== 'undefined') {
	Module['pthreadMainPrefixURL'] = OGVLoader.base + '/';
}
if (options['memoryLimit']) {
	Module['TOTAL_MEMORY'] = options['memoryLimit'];
}
// Hack to let parameters through for pthreads initialization
for (option in options) {
	if (options.hasOwnProperty(option)) {
		Module[option] = options[option];
	}
}

//
// In IE 11 we need a polyfill for Math.imul.
//
// Emscripten provides one, but IE's compilation engine won't
// inline it across files loaded separately, killing performance
// when doing profiling on the main thread with separate modules.
//
// Save the original Math.imul so we can put it back later.
//
var Math_imul_orig = Math.imul;

// hack for https://github.com/brion/ogv.js/issues/448
var OGVDemuxerOgg = Module;
var OGVDemuxerWebM = Module;
var OGVDecoderVideoTheora = Module;
var OGVDecoderVideoVP8 = Module;
var OGVDecoderVideoVP9 = Module;
var OGVDecoderAudioVorbis = Module;
var OGVDecoderAudioOpus = Module;

var OGVDecoderVideoVP8MT = Module;
var OGVDecoderVideoVP9MT = Module;

var OGVDemuxerOggW = Module;
var OGVDemuxerWebMW = Module;
var OGVDecoderVideoTheoraW = Module;
var OGVDecoderVideoVP8W = Module;
var OGVDecoderVideoVP9W = Module;
var OGVDecoderAudioOpusW = Module;
var OGVDecoderAudioVorbisW = Module;
