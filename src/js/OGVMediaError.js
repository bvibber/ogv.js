import extend from './extend.js';

const OGVMediaErrorConstants = {
	MEDIA_ERR_ABORTED: 1,
	MEDIA_ERR_NETWORK: 2,
	MEDIA_ERR_DECODE: 3,
	MEDIA_ERR_SRC_NOT_SUPPORTED: 4
};

/**
 * Analogue of the MediaError class returned by
 * HTMLMediaElement.error property
 */
class OGVMediaError {
	constructor(code, message) {
		this.code = code;
		this.message = message;
	}
}

extend(OGVMediaError, OGVMediaErrorConstants);
extend(OGVMediaError.prototype, OGVMediaErrorConstants);

export default OGVMediaError;
