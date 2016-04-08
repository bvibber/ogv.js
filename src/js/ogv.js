//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2015 Brion Vibber
//

// Version 1.0 web-facing interfaces
window.OGVCompat = require("./OGVCompat.js");
window.OGVLoader = require("./OGVLoader.js");
window.OGVPlayer = require("./OGVPlayer.js");
window.OGVVersion = __OGV_FULL_VERSION__;

/*
var OGVWrapperCodec = require("./OGVWrapperCodec.js");
var OGVDecoderVideoProxy = require("./OGVDecoderVideoProxy.js");
var OGVDecoderAudioProxy = require("./OGVDecoderAudioProxy.js");
*/

module.exports = {
	/*
	DecoderVideoProxy: OGVDecoderVideoProxy,
	DecoderAudioProxy: OGVDecoderAudioProxy,
	WrapperCodec: OGVWrapperCodec,
	*/
	Compat: OGVCompat,
	Loader: OGVLoader,
	Player: OGVPlayer,
	Version: __OGV_FULL_VERSION__
};
