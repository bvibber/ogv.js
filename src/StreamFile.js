/**
 * Quickie wrapper around XHR to fetch a file as array buffer chunks.
 *
 * Call streamFile.readBytes() after an onread event's data has been
 * processed to trigger the next read.
 *
 * IE 10: uses MSStream / MSStreamReader for true streaming
 * Firefox: uses moz-chunked-arraybuffer to buffer & deliver during download
 * Safari, Chrome: uses binary string to buffer & deliver during download
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2014
 * @license MIT-style
 */
function StreamFile(options) {
	var self = this,
		url = options.url,
		onstart = options.onstart || function(){},
		onbuffer = options.onbuffer || function(){},
		onread = options.onread || function(){},
		ondone = options.ondone || function(){},
		onerror = options.onerror || function(){},
		bufferSize = options.bufferSize || 4096,
		seekPosition = 0,
		//chunkSize = 1024 * 1024, // read/buffer up to a megabyte at a time
		chunkSize = 0,
		waitingForInput = false,
		doneBuffering = false,
		bytesTotal = 0,
		bytesBuffered = 0,
		bytesRead = 0;

	
	// -- internal private methods
	var internal = {
		/**
		 * @var {XMLHttpRequest}
		 */
		xhr: null,

		/**
		 * Test if a given responseType value is valid on an XHR
		 *
		 * @return boolean
		 */
		tryMethod: function(rt) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url);
			try {
				// Set the response type and see if it explodes!
				xhr.responseType = rt;
			} catch (e) {
				// Safari 6 throws a DOM Exception on invalid setting
				return false;
			}
			// Other browsers just don't accept the setting, so check
			// whether it made it through.
			return (xhr.responseType == rt);
		},

		setBytesTotal: function(xhr) {
			var contentLength = xhr.getResponseHeader('Content-Length');
			if (contentLength == null || contentLength == '') {
				// Unknown file length... maybe streaming live?
				bytesTotal = 0;
			} else {
				bytesTotal = parseInt(contentLength, 10);
			}
		},

		getMetadata: function() {
			var xhr = new XMLHttpRequest();
			xhr.open("HEAD", url);
			xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 2) {
					internal.onXHRHeadersReceived(xhr);
				} else if (xhr.readyState == 4) {
					xhr.onreadystatechange = null;
					xhr = null;
					internal.openXHR();
				}
			};
			xhr.send();
		},
		
		openXHR: function() {
			var xhr = internal.xhr = new XMLHttpRequest();
			xhr.open("GET", url);

			internal.setXHROptions(xhr);

			var range = null;
			if (seekPosition) {
				range = 'bytes=' + seekPosition + '-';
			}
			if (chunkSize) {
				range += (seekPosition + chunkSize - 1);
			}
			if (range !== null) {
				xhr.setRequestHeader('Range', range);
			}
		
			bytesBuffered = 0;
			bytesRead = 0;

			xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 2) {
					//internal.onXHRHeadersReceived(xhr);
				} else if (xhr.readyState == 3) {
					internal.onXHRLoading(xhr);
				} else if (xhr.readyState == 4) {
					// Complete.
					internal.onXHRDone(xhr);
				}
			};

			xhr.send();
		},
		
		setXHROptions: function(xhr) {
			throw new Error('abstract function');
		},

		onXHRHeadersReceived: function(xhr) {
			if (xhr.status >= 400) {
				// errrorrrrrrr
				console.log("HTTP " + xhr.status + ": " +xhr.statusText);
				onerror();
				xhr.abort();
			} else {
				internal.setBytesTotal(xhr);
				onstart();
			}
		},
		
		onXHRLoading: function(xhr) {
			throw new Error('abstract function');
		},
		
		onXHRDone: function(xhr) {
			console.log("DONE BUFFERING", xhr);
			doneBuffering = true;
		},
		
		dataToRead: function() {
			throw new Error('abstract function');
		},
		
		popBuffer: function() {
			throw new Error('abstract function');
		},
		
		clearBuffers: function() {
			bytesRead = 0;
			bytesBuffered = 0;
			doneBuffering = false;
			waitingForInput = true;
		},

		// Read the next binary buffer out of the buffered data
		readNextChunk: function() {
			if (waitingForInput) {
				waitingForInput = false;
				onread(internal.popBuffer());
				if (doneBuffering && !internal.dataToRead()) {
					// We're out of data!
					ondone();
				}
			}
		},

	};

	// -- Public methods
	self.readBytes = function() {
		if (internal.dataToRead()) {
			var buffer = internal.popBuffer();
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

	self.abort = function() {
		if (internal.xhr) {
			internal.xhr.onreadystatechange = null;
			internal.xhr.onprogress = null;
			internal.xhr.abort();
			internal.xhr = null;
			internal.clearBuffers();
		}
	};
	
	self.seek = function(bytePosition) {
		console.log('seeking to: ' + bytePosition);
		self.abort();
		seekPosition = bytePosition;
		internal.openXHR();
		self.readBytes();
	};

	// -- public properties
	Object.defineProperty(self, 'bytesTotal', {
		get: function() {
			return bytesTotal;
		}
	});
	
	Object.defineProperty(self, 'bytesBuffered', {
		get: function() {
			return seekPosition + bytesBuffered;
		}
	});

	Object.defineProperty(self, 'bytesRead', {
		get: function() {
			return seekPosition + bytesRead;
		}
	});

	var orig = {
		clearBuffers: internal.clearBuffers
	};

	// -- Backend selection and method overrides
	if (internal.tryMethod('moz-chunked-arraybuffer')) {
		console.log("Streaming input using moz-chunked-arraybuffer");

		internal.setXHROptions = function(xhr) {
			xhr.responseType = 'moz-chunked-arraybuffer';

			xhr.onprogress = function() {
				// xhr.response is a per-chunk ArrayBuffer
				var buffer = xhr.response;

				if (buffer) {
					bytesBuffered += buffer.byteLength;
					onbuffer();
					buffers.push(buffer);
				
					internal.readNextChunk();
				}
			};
		};

		var buffers = [];
		
		internal.dataToRead = function() {
			return (buffers.length > 0);
		};

		internal.popBuffer = function() {
			var buffer = buffers.shift();
			if (!bufferSize || bufferSize >= buffer.byteLength) {
				bytesRead += buffer.byteLength;
				return buffer;
			} else {
				// Split the buffer and requeue the rest
				var thisBuffer = buffer.slice(0, bufferSize),
					nextBuffer = buffer.slice(bufferSize);
				buffers.unshift(nextBuffer);
				bytesRead += thisBuffer.byteLength;
				return thisBuffer;
			}
		};
		
		internal.clearBuffers = function() {
			orig.clearBuffers();
			buffers.splice(0, buffers.length);
		};
		
		internal.onXHRLoading = function(xhr) {
			// we have to get from the 'progress' event
		};
		
	} else if (internal.tryMethod('ms-stream')) {
		// IE 10 supports returning a Stream from XHR.
		console.log("Streaming input using MSStreamReader");
		
		// Don't bother reading in chunks, MSStream handles it for us
		chunkSize = 0;
		
		var stream, streamReader;
		
		internal.setXHROptions = function(xhr) {
			xhr.responseType = 'ms-stream';
		};
		
		internal.onXHRLoading = function(xhr) {
			// Transfer us over to the StreamReader...
			stream = xhr.response;
			xhr.onreadystatechange = null;
			onstart();
		};

		self.readBytes = function() {
			if (stream) {
				streamReader = new MSStreamReader();
				streamReader.onload = function(event) {
					var buffer = event.target.result,
						len = buffer.byteLength;
					if (len > 0) {
						bytesBuffered += len;
						bytesRead += len;
						onread(buffer);
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

	} else if ((new XMLHttpRequest()).overrideMimeType !== undefined) {

		// Use old binary string method since we can read reponseText
		// progressively and extract ArrayBuffers from that.
		console.log("Streaming input using XHR progressive binary string");
		
		internal.setXHROptions = function(xhr) {
			xhr.responseType = "text";
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		};
	
		var lastPosition = 0;
		
		// Is there data available to read?
		internal.dataToRead = function() {
			return lastPosition < internal.xhr.responseText.length;
		};

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
		internal.popBuffer = function() {
			var chunk = internal.xhr.responseText.slice(lastPosition, lastPosition + bufferSize);
			lastPosition += chunk.length;
			bytesRead += chunk.length;
			return stringToArrayBuffer(chunk);
		}
		
		internal.clearBuffers = function() {
			orig.clearBuffers();
			lastPosition = 0;
		};
		
		internal.onXHRLoading = function(xhr) {
			// xhr.responseText is a binary string of entire file so far
			bytesBuffered = internal.xhr.responseText.length;
			onbuffer();
			internal.readNextChunk();
		};
		
	} else {
		throw new Error("No streaming HTTP input method found.");
	}
	
	internal.getMetadata();
}
