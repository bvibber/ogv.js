(function() {

	var codec;

	/**
	 * Quickie wrapper around XHR to fetch a file as blob chunks.
	 * Does not yet actually deliver during download, however.
	 * Safari doesn't seem to currently support a streaming/progressive
	 * XHR option that I can see. :( May have to do multiple partial reqs.
	 */
	function StreamFile(options) {
		var url = options.url,
			reader = new XMLHttpRequest(),
			onread = options.onread,
			ondone = options.ondone,
			onerror = options.onerror,
			xhr = new XMLHttpRequest(),
			bufferSize = options.bufferSize || 1024 * 1024,
			bufferDelay = 250,
			lastPosition = 0;

		function dataRemaining() {
			return xhr.response.byteLength > lastPosition;
		}

		function readChunk() {
			if (dataRemaining()) {
				var chunk;
				if (lastPosition == 0 && xhr.response.byteLength <= bufferSize) {
					// quick hack for IE demos -- don't use slice() on first chunk
					// so we can still render it out :P
					chunk = xhr.response;
				} else {
					// To stream for real, we'd want a chunked mode that only
					// puts the current chunk into xhr.response. This isn't
					// standard yet, however.
					chunk = xhr.response.slice(lastPosition, lastPosition + bufferSize);
				}
				lastPosition = lastPosition + chunk.byteLength;
				onread(chunk);
			}
		}

		function asyncProcessChunk() {
			if (dataRemaining()) {
				readChunk();
				window.setTimeout(asyncProcessChunk, bufferDelay);
			} else {
				ondone();
				xhr = null;
			}
		}
		
		xhr.open("GET", url);
		xhr.responseType = "arraybuffer";
		xhr.onreadystatechange = function(event) {
			if (xhr.readyState == 2) {
				if (xhr.status >= 400) {
					// errrorrrrrrr
					onerror("HTTP " + xhr.status + ": " +xhr.statusText);
					xhr.abort();
					xhr = null;
				}
			} else if (xhr.readyState == 3) {
				// partial data...
				// on Firefox we can use 'moz-blob' but there's no equivalent in Safari.
				// figure out later
			} else if (xhr.readyState == 4) {
				asyncProcessChunk();
			}
		};
		xhr.send();
	}

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitAnimationFrame;
	var scheduleNextTick;
	if (requestAnimationFrame) {
		scheduleNextTick = requestAnimationFrame;
	} else {
		scheduleNextTick = function(func) {
			window.setTimeout(func, 0);
		}
	}

	var player = document.getElementById('player'),
		canvas = player.querySelector('canvas'),
		ctx = canvas.getContext('2d');
	
	function showSelectedVideo() {
		var url = "https://upload.wikimedia.org/wikipedia/commons/a/aa/Thresher-Sharks-Use-Tail-Slaps-as-a-Hunting-Strategy-pone.0067380.s003.ogv";
		//var url = "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/54/Great_Eastern_Highway_down_Greenmount.ogv/Great_Eastern_Highway_down_Greenmount.ogv.480p.ogv";
		//var url = "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b7/How_Open_Access_Empowered_a_16-Year-Old_to_Make_Cancer_Breakthrough.ogv/How_Open_Access_Empowered_a_16-Year-Old_to_Make_Cancer_Breakthrough.ogv.480p.ogv";
		console.log("Going to try streaming data from " + url);

		if (codec) {
			// kill the previous video if any
			codec.destroy();
		}
		codec = new OgvJs();
		codec.init();
		var stream = new StreamFile({
			url: url,
			onread: function(data) {
				console.log("We have a buffer of size " + data.byteLength);
				codec.receiveInput(data);
				function pingProcess() {
					console.log("ping process!");
					if (codec.process()) {
						console.log("SCHEDULING MORE");
						scheduleNextTick(pingProcess);
					} else {
						console.log("NO MORE PACKETS");
					}
				}
				scheduleNextTick(pingProcess);
			},
			ondone: function() {
				console.log("reading done.");
			},
			onerror: function(err) {
				console.log("reading encountered error: " + err);
			}
		});
	}
	showSelectedVideo();

})();
