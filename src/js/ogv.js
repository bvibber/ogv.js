//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2019 Brion Vibber
//

var OGVCompat = require("./OGVCompat.js"),
	OGVLoader = require("./OGVLoader.js"),
	OGVMediaError = require('./OGVMediaError.js'),
	OGVMediaType = require("./OGVMediaType.js").default,
	OGVPlayer = require("./OGVPlayer.js"),
	OGVTimeRanges = require('./OGVTimeRanges.js').default,
	OGVVersion = __OGV_FULL_VERSION__;

// Version 1.0's web-facing and test-facing interfaces
if (window) {
	window.OGVCompat = OGVCompat;
	window.OGVLoader = OGVLoader;
	window.OGVMediaError = OGVMediaError; // exposed for testing, for now
	window.OGVMediaType = OGVMediaType;
	window.OGVTimeRanges = OGVTimeRanges; // exposed for testing, for now
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
