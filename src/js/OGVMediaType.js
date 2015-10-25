function OGVMediaType(contentType) {
	contentType = '' + contentType;

	var self = this;
	self.major = null;
	self.minor = null;
	self.codecs = null;

	function trim(str) {
		return str.replace(/^\s+/, '').replace(/\s+$/, '');
	}

	function split(str, sep, limit) {
		var bits = str.split(sep, limit).map(function(substr) {
			return trim(substr);
		});
		if (typeof limit === 'number') {
			while (bits.length < limit) {
				bits.push(null);
			}
		}
		return bits;
	}

	var parts = split(contentType, ';');
	if (parts.length) {
		var base = parts.shift();
		if (base) {
			var bits = split(base, '/', 2);
			self.major = bits[0];
			self.minor = bits[1];
		}

		parts.forEach(function(str) {
			var matches = str.match(/^codecs\s*=\s*"(.*?)"$/);
			if (matches) {
				self.codecs = split(matches[1], ',');
			}
		});
	}
}

module.exports = OGVMediaType;
