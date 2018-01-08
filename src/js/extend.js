function extend(dest, src) {
	for (prop in src) {
		if (src.hasOwnProperty(prop)) {
			dest[prop] = src[prop];
		}
	}
}

module.exports = extend;
