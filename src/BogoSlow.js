/**
 * A quick CPU/JS engine benchmark to guesstimate whether we're
 * fast enough to handle 360p video in JavaScript.
 */
function BogoSlow() {
	var self = this;

	var timer;
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
	 * @property {boolean}
	 */
	Object.defineProperty(self, 'cutoff', {
		get: function() {
			// 2012 Retina MacBook Pro (Safari 7)  ~150,000
			// 2009 Dell T5500         (IE 11)     ~100,000
			// iPad Air                (iOS 7)      ~65,000
			// 2010 MBP / OS X 10.9    (Safari 7)   ~62,500
			// 2010 MBP / Win7 VM      (IE 11)      ~50,000+-
			//   ^ these play 360p ok
			// ----------- line of moderate doom ----------
			//   v these play 160p ok
			// iPad Mini non-Retina    (iOS 8 beta) ~25,000
			// Dell Inspiron Duo       (IE 11)      ~25,000
			// Surface RT              (IE 11)      ~18,000
			// iPod Touch 5th-gen      (iOS 8 beta) ~16,000
			// ------------ line of total doom ------------
			//   v these play only audio, if that
			// iPod 4th-gen            (iOS 6.1)     ~6,750
			// iPhone 3Gs              (iOS 6.1)     ~4,500
			return 50000;
		}
	});
	
	Object.defineProperty(self, 'slow', {
		get: function() {
			return (self.speed < self.cutoff);
		}
	});
}
