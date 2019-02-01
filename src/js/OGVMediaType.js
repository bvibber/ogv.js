function trim(str) {
	return str.replace(/^\s+/, '').replace(/\s+$/, '');
}

function split(str, sep, limit) {
	let bits = str.split(sep, limit).map((substr) => trim(substr));
	if (typeof limit === 'number') {
		// Extend with nulls to the expected length.
		while (bits.length < limit) {
			bits.push(null);
		}
	}
	return bits;
}

class OGVMediaType {
	constructor(contentType) {
		contentType = String(contentType);

		this.major = null;
		this.minor = null;
		this.codecs = null;

		let parts = split(contentType, ';');
		if (parts.length) {
			let base = parts.shift();
			if (base) {
				let bits = split(base, '/', 2);
				this.major = bits[0];
				this.minor = bits[1];
			}

			for (let i in parts) {
				let str = parts[i];
				let matches = str.match(/^codecs\s*=\s*"(.*?)"$/);
				if (matches) {
					this.codecs = split(matches[1], ',');
					break;
				}
			}
		}
	}
}

export default OGVMediaType;
