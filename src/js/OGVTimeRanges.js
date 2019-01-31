/**
 * Analogue of the TimeRanges class returned by various
 * HTMLMediaElement properties
 */
class OGVTimeRanges {
	/**
	 * Pass an array of two-element arrays, each containing a start and end time.
	 */
	constructor(ranges) {
		this._ranges = ranges;
		this.length = ranges.length;
	}

	start(i) {
		if (i < 0 || i > this.length || i !== (i|0)) {
			throw new RangeError("Invalid index");
		}
		return this._ranges[i][0];
	}

	end(i) {
		if (i < 0 || i > this.length || i !== (i|0)) {
			throw new RangeError("Invalid index");
		}
		return this._ranges[i][1];
	}
}


export default OGVTimeRanges;
