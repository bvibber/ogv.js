//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2016 Brion Vibber
//

var OGVCompat = require("./OGVCompat.js"),
	OGVLoader = require("./OGVLoader.js"),
	OGVMediaType = require("./OGVMediaType.js"),
	OGVPlayer = require("./OGVPlayer.js"),
	OGVVersion = __OGV_FULL_VERSION__;

// Version 1.0's web-facing and test-facing interfaces
if (window) {
	window.OGVCompat = OGVCompat;
	window.OGVLoader = OGVLoader;
	window.OGVMediaType = OGVMediaType;
	window.OGVPlayer = OGVPlayer;
	window.OGVVersion = OGVVersion;
}

module.exports = {
	OGVCompat: OGVCompat,
	OGVLoader: OGVLoader,
	OGVMediaType: OGVMediaType,
	OGVPlayer: OGVPlayer,
	OGVVersion: OGVVersion
};
