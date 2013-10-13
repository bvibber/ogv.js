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
	
	var foundMethod = false;
	function tryMethod(rt) {
		if (foundMethod) {
			return false;
		}
		xhr.responseType = rt;
		return (xhr.responseType == rt);
	}

	if (tryMethod('moz-chunked-arraybuffer')) {
		foundMethod = true;

		console.log("Streaming input using moz-chunked-arraybuffer");
	
		var buffers = [],
			waitingForInput = false,
			doneBuffering = false;
		
		function popBuffer(bufferSize) {
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
		xhr.onprogress = function(event) {
			// todo: is it safe to keep this buffer or should we copy it?
			buffers.push(xhr.response);

			if (waitingForInput) {
				onread(popBuffer(bufferSize));
				waitingForInput = false;
				if (doneBuffering && buffers.length == 0) {
					// We're out of data!
					ondone();
				}
			}
		}
		self.readBytes = function(bufferSize) {
			if (buffers.length > 0) {
				var buffer = popBuffer(bufferSize);
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
	}
	
	if (tryMethod('ms-stream')) {
		foundMethod = true;
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

		function processInput() {
			var chunk = xhr.responseText.slice(lastPosition);
			lastPosition += chunk.length;
		
			if (chunk.length > 0) {
				var buffer = stringToArrayBuffer(chunk);
				onread(buffer);
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
			} else if (xhr.readyState == 3) {
				// Partial content
				processInput();
			} else if (xhr.readyState == 4) {
				// Complete.
				processInput();
				ondone();
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
