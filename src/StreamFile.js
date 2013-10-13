/**
 * Quickie wrapper around XHR to fetch a file as array buffer chunks.
 * Does not yet actually deliver during download, however.
 * Safari doesn't seem to currently support a streaming/progressive
 * XHR option that I can see. :( May have to do multiple partial reqs.
 */
function StreamFile(options) {
	var self = this,
		url = options.url,
		onread = options.onread,
		ondone = options.ondone,
		onerror = options.onerror,
		bufferSize = options.bufferSize || 4096,
		lastPosition = 0;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	
	var buffers = [],
		waitingForInput = false,
		doneBuffering = false;
	
	function popBuffer() {
		var buffer = buffers.shift();
		if (!bufferSize || bufferSize >= buffer.byteLength) {
			return buffer;
		} else {
			// Split the buffer and requeue the rest
			var thisBuffer = buffer.slice(0, bufferSize),
				nextBuffer = buffer.slice(bufferSize);
			buffers.unshift(nextBuffer);
			return thisBuffer;
		}
	}
	function handleInput(buffer) {
		buffers.push(buffer);
		if (waitingForInput) {
			onread(popBuffer());
			waitingForInput = false;
			if (doneBuffering && buffers.length == 0) {
				// We're out of data!
				ondone();
			}
		}
	}
	xhr.onreadystatechange = function(event) {
		if (xhr.readyState == 2) {
			if (xhr.status >= 400) {
				// errrorrrrrrr
				callback(null, "HTTP " + xhr.status + ": " +xhr.statusText);
				onerror();
				xhr.abort();
			}
		} else if (xhr.readyState == 4) {
			// Complete.
			doneBuffering = true;
		}
	};
	self.readBytes = function() {
		if (buffers.length > 0) {
			var buffer = popBuffer();
			setTimeout(function() {
				onread(buffer);
			}, 0);
		} else if (doneBuffering) {
			// We're out of data!
			setTimeout(function() {
				ondone();
			}, 0);
		} else {
			// Nothing queued...
			waitingForInput = true;
		}
	}
	
	var foundMethod = false;
	function tryMethod(rt) {
		if (foundMethod) {
			return false;
		}
		xhr.responseType = rt;
		if (xhr.responseType == rt) {
			foundMethod = true;
			return true;
		}
	}

	if (tryMethod('moz-chunked-arraybuffer')) {
		console.log("Streaming input using moz-chunked-arraybuffer");
		
		xhr.onprogress = function(event) {
			// xhr.response is a per-chunk ArrayBuffer
			handleInput(xhr.response);
		}
	}
	
	if (tryMethod('ms-stream')) {
		// IE 10 supports returning a Stream from XHR.
		console.log("Streaming input using MSStreamReader");
		
		var stream, streamReader;
		function readNextChunk() {
			streamReader = new MSStreamReader();
			streamReader.onload = function(event) {
				if (event.target.result.byteLength > 0) {
					onread(event.target.result);

					// We have to schedule the next read.
					readNextChunk();
				} else {
					// Zero length means end of stream.
					ondone();
				}
			}
			streamReader.onerror = function(event) {
				onerror('mystery error streaming');
			}
			streamReader.readAsArrayBuffer(stream, bufferSize);
		}
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 2) {
				if (xhr.status >= 400) {
					// errrorrrrrrr
					callback(null, "HTTP " + xhr.status + ": " +xhr.statusText);
					onerror();
					xhr.abort();
				}
			} else if (xhr.readyState == xhr.LOADING) {
				// Transfer us over to the StreamReader...
				stream = xhr.response;
				readNextChunk();
				xhr.onreadystatechange = null;
			}
		}
	}
	
	if (!foundMethod && xhr.overrideMimeType !== undefined) {
		foundMethod = true;

		// Use old binary string method since we can read reponseText
		// progressively and extract ArrayBuffers from that.
		console.log("Streaming input using XHR progressive binary string");
		xhr.responseType = "text";
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
	

		// Is there a better way to do this conversion? :(
		function stringToArrayBuffer(chunk) {
			var len = chunk.length,
				buffer = new ArrayBuffer(len),
				bytes = new Uint8Array(buffer);
			for (var i = 0; i < len; i++) {
				bytes[i] = chunk.charCodeAt(i);
			}
			return buffer;
		}

		function extractBuffer() {
			var chunk = xhr.responseText.slice(lastPosition);
			lastPosition += chunk.length;
			return stringToArrayBuffer(chunk);
		}
	
		var orsc = xhr.onreadystatechange;
		xhr.onreadystatechange = function(event) {
			if (xhr.readyState == 3) {
				// xhr.response is a binary string of entire file so far
				handleInput(extractBuffer());
			} else {
				return orsc();
			}
		};
	}
	
	if (!foundMethod) {
		throw new Error("No streaming HTTP input method found.");
	}
	
	xhr.send();
	
	self.abort = function() {
		xhr.abort();
	};
}
