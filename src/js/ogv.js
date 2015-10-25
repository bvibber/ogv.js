//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2015 Brion Vibber
//
var OGV;

module.exports = OGV = {};

require("BogoSlow.js");

require("OGVCompat.js");

// -- OGVLoader.js
require("./OGVLoader.js");

// -- StreamFile.js
require("./StreamFile.js");

// -- AudioFeeder.js
require("./AudioFeeder.js");

// -- FrameSink.js
require("./FrameSink.js");

// -- WebGLFrameSink.js
require("./WebGLFrameSink.js");

// -- Bisector.js
require("./Bisector.js");

// -- OGVMediaType.js
require("./OGVMediaType.js");

// -- OGVWrapperCodec.js
require("./OGVWrapperCodec.js");

// -- OGVProxyClass.js
require("./OGVProxyClass.js");

// -- OGVDecoderAudioProxy.js
require("./OGVDecoderAudioProxy.js");

// -- OGVDecoderVideoProxy.js
require("./OGVDecoderVideoProxy.js");

// -- OGVPlayer.js
require("./OGVPlayer.js");

// exports
OGV.Loader = OGVLoader;
OGV.MediaType = OGVMediaType;
OGV.TimeRanges = OGVTimeRanges;
OGV.Player = OGVPlayer;

