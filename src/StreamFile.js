/**
 * Quickie wrapper around XHR to fetch a file as array buffer chunks.
 *
 * Call streamFile.readBytes() after an onread event's data has been
 * processed to trigger the next read.
 *
 * IE 10: uses MSStream / MSStreamReader for true streaming
 * Firefox: uses moz-chunked-arraybuffer to buffer & deliver during download
 * Safari, Chrome: uses binary string to buffer & deliver during download
 */
function StreamFile(options) {
	var self = this,
		url = options.url,
		onstart = options.onstart || function(){},
		onread = options.onread || function(){},
		ondone = options.ondone || function(){},
		onerror = options.onerror || function(){},
		bufferSize = options.bufferSize || 4096;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	
	var foundMethod = false;
	function tryMethod(rt) {
		if (foundMethod) {
			return false;
		}
		try {
			// Set the response type and see if it explodes!
			xhr.responseType = rt;
		} catch (e) {
			// Safari 6 throws a DOM Exception on invalid setting
			return false;
		}
		// Other browsers just don't accept the setting, so check
		// whether it made it through.
		if (xhr.responseType == rt) {
			foundMethod = true;
			return true;
		}
		return false;
	}

	var waitingForInput = false,
		doneBuffering = false;

	if (tryMethod('moz-chunked-arraybuffer')) {
		console.log("Streaming input using moz-chunked-arraybuffer");
		
		var buffers = [];
		
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
				waitingForInput = false;
				onread(popBuffer());
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
				} else {
					onstart();
				}
			} else if (xhr.readyState == 4) {
				// Complete.
				doneBuffering = true;
			}
		};
		
		xhr.onprogress = function(event) {
			// xhr.response is a per-chunk ArrayBuffer
			handleInput(xhr.response);
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
		};
	}
	
	if (tryMethod('ms-stream')) {
		// IE 10 supports returning a Stream from XHR.
		console.log("Streaming input using MSStreamReader");
		
		var stream, streamReader;
		
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
				xhr.onreadystatechange = null;
				onstart();
			}
		}
		
		self.readBytes = function() {
			if (stream) {
				streamReader = new MSStreamReader();
				streamReader.onload = function(event) {
					if (event.target.result.byteLength > 0) {
						onread(event.target.result);
					} else {
						// Zero length means end of stream.
						ondone();
					}
				}
				streamReader.onerror = function(event) {
					onerror('mystery error streaming');
				}
				streamReader.readAsArrayBuffer(stream, bufferSize);
			} else {
				waitingForInput = true;
			}
		};
	}
	
	if (!foundMethod && xhr.overrideMimeType !== undefined) {
		foundMethod = true;

		// Use old binary string method since we can read reponseText
		// progressively and extract ArrayBuffers from that.
		console.log("Streaming input using XHR progressive binary string");
		xhr.responseType = "text";
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
	
		var lastPosition = 0,
			doneBuffering = false;
		
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

		// Return a buffer with up to bufferSize from the next data
		function popBuffer() {
			var chunk = xhr.responseText.slice(lastPosition, lastPosition + bufferSize);
			lastPosition += chunk.length;
			return stringToArrayBuffer(chunk);
		}

		// Is there data available to read?
		function dataToRead() {
			return lastPosition < xhr.responseText.length;
		}
		
		// Read the next binary buffer out of the input string
		function readNextChunk() {
			if (waitingForInput) {
				waitingForInput = false;
				onread(popBuffer());
				if (doneBuffering && !dataToRead()) {
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
				} else {
					onstart();
				}
			} else if (xhr.readyState == 3) {
				// xhr.response is a binary string of entire file so far
				readNextChunk();
			} else if (xhr.readyState == 4) {
				// Complete.
				doneBuffering = true;
			}
		};
		
		self.readBytes = function() {
			if (dataToRead()) {
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
