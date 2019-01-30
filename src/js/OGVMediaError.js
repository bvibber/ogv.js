"use strict";

var extend = require('./extend.js');

var OGVMediaErrorConstants = {
	MEDIA_ERR_ABORTED: 1,
	MEDIA_ERR_NETWORK: 2,
	MEDIA_ERR_DECODE: 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};

/**
 * Constructor for analogue of the MediaError class
 * returned by HTMLMediaElement.error property
 */
function OGVMediaError(code, message) {
	this.code = code;
	this.message = message;
};
extend(OGVMediaError, OGVMediaErrorConstants);
extend(OGVMediaError.prototype, OGVMediaErrorConstants);

module.exports = OGVMediaError;
