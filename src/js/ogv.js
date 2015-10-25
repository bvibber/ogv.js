//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2015 Brion Vibber
//

require("./BogoSlow.js");

var OGVCompat = require("./OGVCompat.js");

// -- OGVPlayer.js
var OGVPlayer = require("./OGVPlayer.js");

var OGVWrapperCodec = require("./OGVWrapperCodec.js");

var OGVDecoderVideoProxy = require("./OGVDecoderVideoProxy.js");

var OGVDecoderAudioProxy = require("./OGVDecoderAudioProxy.js");

module.exports = {
	DecoderVideoProxy: OGVDecoderVideoProxy,
	DecoderAudioProxy: OGVDecoderAudioProxy,
	WrapperCodec: OGVWrapperCodec,
	Compat: OGVCompat,
	Player: OGVPlayer
};