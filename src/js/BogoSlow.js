"use strict";

/**
 * A quick CPU/JS engine benchmark to guesstimate whether we're
 * fast enough to handle 360p video in JavaScript.
 */
function BogoSlow() {
	var self = this;

	var timer;
	// FIXME: avoid to use window scope here
	if (window.performance && window.performance.now) {
		timer = function() {
			return window.performance.now();
		};
	} else {
		timer = function() {
			return Date.now();
		};
	}

	var savedSpeed = null;
	function run() {
		var ops = 0;
		var fibonacci = function(n) {
			ops++;
			if (n < 2) {
				return n;
			} else {
				return fibonacci(n - 2) + fibonacci(n - 1);
			}
		};

		var start = timer();

		fibonacci(30);

		var delta = timer() - start;
		savedSpeed = (ops / delta);
	}

	/**
	 * Return a scale value of operations/sec from the benchmark.
	 * If the benchmark has already been run, uses a memoized result.
	 *
	 * @property {number}
	 */
	Object.defineProperty(self, 'speed', {
		get: function() {
			if (savedSpeed === null) {
				run();
			}
			return savedSpeed;
		}
	});

	/**
	 * Return the defined cutoff speed value for 'slow' devices,
	 * based on results measured from some test devices.
	 *
	 * @property {number}
	 */
	Object.defineProperty(self, 'slowCutoff', {
		get: function() {
			// 2012 Retina MacBook Pro (Safari 7)  ~150,000
			// 2009 Dell T5500         (IE 11)     ~100,000
			// iPad Air                (iOS 7)      ~65,000
			// 2010 MBP / OS X 10.9    (Safari 7)   ~62,500
			// 2010 MBP / Win7 VM      (IE 11)      ~50,000+-
			//   ^ these play 360p ok
			// ----------- line of moderate doom ----------
			return 50000;
			//   v these play 160p ok
			// iPad Mini non-Retina    (iOS 8 beta) ~25,000
			// Dell Inspiron Duo       (IE 11)      ~25,000
			// Surface RT              (IE 11)      ~18,000
			// iPod Touch 5th-gen      (iOS 8 beta) ~16,000
		}
	});

	/**
	 * Return the defined cutoff speed value for 'too slow' devices,
	 * based on results measured from some test devices.
	 *
	 * No longer used.
	 *
	 * @property {number}
	 * @deprecated
	 */
	Object.defineProperty(self, 'tooSlowCutoff', {
		get: function() {
			return 0;
		}
	});

	/**
	 * 'Slow' devices can play audio and should sorta play our
	 * extra-tiny Wikimedia 160p15 transcodes
	 *
	 * @property {boolean}
	 */
	Object.defineProperty(self, 'slow', {
		get: function() {
			return (self.speed < self.slowCutoff);
		}
	});

	/**
	 * 'Too slow' devices aren't reliable at all
	 *
	 * @property {boolean}
	 */
	Object.defineProperty(self, 'tooSlow', {
		get: function() {
			return (self.speed < self.tooSlowCutoff);
		}
	});
}

module.exports = BogoSlow;
