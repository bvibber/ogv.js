/**
 * Give as your 'process' function something that will trigger an async
 * operation, then call the left() or right() methods to run another
 * iteration, bisecting to the given direction.
 *
 * Caller is responsible for determining when done.
 *
 * @params options object {
 *   start: number,
 *   end: number,
 *   process: function(start, position, end)
 * }
 */
class Bisector {
	constructor(options) {
		this.lower = options.start;
		this.upper = options.end;
		this.onprocess = options.process;
		this.position = 0;
		this.n = 0;
	}

	iterate() {
		this.n++;
		this.position = Math.floor((this.lower + this.upper) / 2);
		return this.onprocess(this.lower, this.upper, this.position);
	}

	start() {
		this.iterate();
		return this;
	}

	left() {
		this.upper = this.position;
		return this.iterate();
	}

	right() {
		this.lower = this.position;
		return this.iterate();
	};
}

export default Bisector;
