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
function Bisector(options) {
	var start = options.start,
		end = options.end,
		position = 0,
		self = this,
		n = 0;

	function iterate() {
		n++;
		position = Math.floor((start + end) / 2);
		return options.process(start, end, position);
	}

	self.start = function() {
		iterate();
		return self;
	};

	self.left = function() {
		end = position;
		return iterate();
	};

	self.right = function() {
		start = position;
		return iterate();
	};
}

module.exports = Bisector;
