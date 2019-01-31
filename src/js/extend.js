function extend(dest, src) {
	for (let prop in src) {
		if (src.hasOwnProperty(prop)) {
			dest[prop] = src[prop];
		}
	}
}

export default extend;
