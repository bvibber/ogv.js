//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2016 Brion Vibber
//

// Version 1.0's web-facing and test-facing interfaces
window.OGVCompat = require("./OGVCompat.js");
window.OGVLoader = require("./OGVLoader.js");
window.OGVMediaType = require("./OGVMediaType.js");
window.OGVPlayer = require("./OGVPlayer.js");
window.OGVVersion = __OGV_FULL_VERSION__;

module.exports = {
	Compat: OGVCompat,
	Loader: OGVLoader,
	MediaType: OGVMediaType,
	Player: OGVPlayer,
	Version: __OGV_FULL_VERSION__
};
