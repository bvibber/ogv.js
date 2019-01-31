//
// -- ogv.js
// https://github.com/brion/ogv.js
// Copyright (c) 2013-2019 Brion Vibber
//

import es6promise from 'es6-promise';
es6promise.polyfill();

import OGVCompat from './OGVCompat.js';
import OGVLoader from './OGVLoaderWeb.js';
import OGVMediaError from './OGVMediaError.js';
import OGVMediaType from './OGVMediaType.js';
import OGVPlayer from './OGVPlayer.js';
import OGVTimeRanges from './OGVTimeRanges.js';
const OGVVersion = __OGV_FULL_VERSION__;

// Version 1.0's web-facing and test-facing interfaces
if (typeof window === 'object') {
	window.OGVCompat = OGVCompat;
	window.OGVLoader = OGVLoader;
	window.OGVMediaError = OGVMediaError; // exposed for testing, for now
	window.OGVMediaType = OGVMediaType;
	window.OGVTimeRanges = OGVTimeRanges; // exposed for testing, for now
	window.OGVPlayer = OGVPlayer;
	window.OGVVersion = OGVVersion;
}

export {
	OGVCompat,
	OGVLoader,
	OGVMediaError,
	OGVMediaType,
	OGVPlayer,
	OGVTimeRanges,
	OGVVersion
};
