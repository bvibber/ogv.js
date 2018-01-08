/**
 * Constructor for an analogue of the TimeRanges class
 * returned by various HTMLMediaElement properties
 *
 * Pass an array of two-element arrays, each containing a start and end time.
 */
function OGVTimeRanges(ranges) {
	Object.defineProperty(this, 'length', {
		get: function getLength() {
			return ranges.length;
		}
	});
	this.start = function(i) {
		return ranges[i][0];
	};
	this.end = function(i) {
		return ranges[i][1];
	};
	return this;
};

module.exports = OGVTimeRanges;
