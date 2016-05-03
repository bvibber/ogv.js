module.exports = (function() {
	// Don't try to check for setImmediate directly; webpack implements
	// it using setTimeout which will be throttled in background tabs.
	// Checking directly on the global window object skips this interference.
	if (typeof window.setImmediate !== 'undefined') {
		return window.setImmediate;
	}

	// window.postMessage goes straight to the event loop, no throttling.
	if (window && window.postMessage) {
		var nextTickQueue = [];
		window.addEventListener('message', function(event) {
			if (event.source === window) {
				var data = event.data;
				if (typeof data === 'object' && data.nextTickBrowserPingMessage) {
					var callback = nextTickQueue.pop();
					if (callback) {
						callback();
					}
				}
			}
		});
		return function(callback) {
			nextTickQueue.push(callback);
			window.postMessage({
				nextTickBrowserPingMessage: true
			}, document.location.toString())
		};
	}

	// Timeout fallback may be poor in background tabs
	return function(callback) {
		setTimeout(callback, 0);
	}
})();
