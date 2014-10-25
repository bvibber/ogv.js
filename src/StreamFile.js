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
		started = false,
		onstart = options.onstart || function(){},
		onbuffer = options.onbuffer || function(){},
		onread = options.onread || function(){},
		ondone = options.ondone || function(){},
		onerror = options.onerror || function(){},
		bufferSize = options.bufferSize || 8192,
		minBufferSize = options.minBufferSize || 65536,
		seekPosition = options.seekPosition || 0,
		chunkSize = options.chunkSize || 1024 * 1024, // read/buffer up to a megabyte at a time
		waitingForInput = false,
		doneBuffering = false,
		bytesTotal = 0,
		bytesRead = 0,
		buffers = [];
		

	
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
			if (seekPosition || chunkSize) {
				range = 'bytes=' + seekPosition + '-';
			}
			if (chunkSize) {
				range += (seekPosition + chunkSize - 1);
			}
			if (range !== null) {
				xhr.setRequestHeader('Range', range);
			}
		
			bytesRead = 0;

			xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 2) {
					//internal.onXHRHeadersReceived(xhr);
					// @todo check that partial content was supported if relevant
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
				started = true;
				onstart();
			}
		},
		
		onXHRLoading: function(xhr) {
			throw new Error('abstract function');
		},
		
		onXHRDone: function(xhr) {
			console.log("DONE BUFFERING");
			doneBuffering = true;
		},
		
		abortXHR: function(xhr) {
			xhr.onreadystatechange = null;
			xhr.abort();
		},
		
		bufferData: function(buffer) {
			if (buffer) {
				buffers.push(buffer);
				onbuffer();
			
				internal.readNextChunk();
			}
		},
		
		bytesBuffered: function() {
			var bytes = 0;
			buffers.forEach(function(buffer) {
				bytes += buffer.byteLength;
			});
			return bytes;
		},
		
		dataToRead: function() {
			return internal.bytesBuffered() >= minBufferSize;
		},
		
		popBuffer: function() {
			var bufferOut = new ArrayBuffer(bufferSize),
				bytesOut = new Uint8Array(bufferOut),
				byteLength = 0;
			
			function stuff(bufferIn) {
				var bytesIn = new Uint8Array(bufferIn);
				bytesOut.set(bytesIn, byteLength);
				byteLength += bufferIn.byteLength;
			}
			
			while (byteLength < minBufferSize) {
				var needBytes = minBufferSize - byteLength,
					nextBuffer = buffers.shift();
				if (!nextBuffer) {
					break;
				}

				if (needBytes >= nextBuffer.byteLength) {
					// if it fits, it sits
					stuff(nextBuffer);
				} else {
					// Split the buffer and requeue the rest
					var croppedBuffer = nextBuffer.slice(0, needBytes),
						remainderBuffer = nextBuffer.slice(needBytes);
					buffers.unshift(remainderBuffer);
					stuff(croppedBuffer);
					break;
				}
			}
			
			console.log('got', bufferOut, byteLength);
			bytesRead += byteLength;
			return bufferOut.slice(0, byteLength);
		},
		
		clearReadState: function() {
			bytesRead = 0;
			doneBuffering = false;
			waitingForInput = true;
		},
		
		clearBuffers: function() {
			internal.clearReadState();
			buffers.splice(0, buffers.length);
		},

		// Read the next binary buffer out of the buffered data
		readNextChunk: function() {
			if (waitingForInput) {
				waitingForInput = false;
				onread(internal.popBuffer());
				if (doneBuffering && !internal.dataToRead()) {
					internal.onReadDone();
				}
			}
		},
		
		onReadDone: function() {
			if (self.bytesBuffered < self.bytesTotal && internal.bytesBuffered() < chunkSize) {
				seekPosition += chunkSize;
				console.log('2 seek to: ' + seekPosition);
				internal.clearReadState();
				internal.openXHR();
			} else {
				// We're out of data!
				setTimeout(function() {
					ondone();
				}, 0);
			}
		},
		
		// See if we can seek within already-buffered data
		quickSeek: function(pos) {
			return false;
		}

	};

	// -- Public methods
	self.readBytes = function() {
		if (internal.dataToRead()) {
			var buffer = internal.popBuffer();
			setTimeout(function() {
				onread(buffer);
			}, 0);
			if (doneBuffering && self.bytesRead < self.bytesTotal && internal.bytesBuffered() < chunkSize) {
				seekPosition += chunkSize;
				console.log('1 seek to: ' + seekPosition);
				internal.clearReadState();
				internal.openXHR();
			}
		} else if (doneBuffering) {
			// We're out of data!
			internal.onReadDone();
		} else {
			// Nothing queued...
			waitingForInput = true;
		}
	};

	self.abort = function() {
		if (internal.xhr) {
			internal.abortXHR(internal.xhr);
			internal.xhr = null;
			internal.clearBuffers();
		}
	};
	
	self.seek = function(bytePosition) {
		console.log('seeking to: ' + bytePosition);
		if (internal.quickSeek(bytePosition)) {
			console.log('quick seek successful');
		} else {
			self.abort();
			seekPosition = bytePosition;
			internal.openXHR();
		}
	};

	// -- public properties
	Object.defineProperty(self, 'bytesTotal', {
		get: function() {
			return bytesTotal;
		}
	});
	
	Object.defineProperty(self, 'bytesBuffered', {
		get: function() {
			return self.bytesRead + internal.bytesBuffered();
		}
	});

	Object.defineProperty(self, 'bytesRead', {
		get: function() {
			return seekPosition + bytesRead;
		}
	});

	// Handy way to call super functions
	var orig = {};
	for (var prop in internal) {
		orig[prop] = internal[prop];
	}

	// -- Backend selection and method overrides
	if (internal.tryMethod('moz-chunked-arraybuffer')) {
		console.log("Streaming input using moz-chunked-arraybuffer");

		internal.setXHROptions = function(xhr) {
			xhr.responseType = 'moz-chunked-arraybuffer';

			xhr.onprogress = function() {
				// xhr.response is a per-chunk ArrayBuffer
				internal.bufferData(xhr.response);
			};
		};
		
		internal.abortXHR = function(xhr) {
			xhr.onprogress = null;
			orig.abortXHR(xhr);
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
		var restarted = false;
		
		internal.setXHROptions = function(xhr) {
			console.log('setting up new xhr');
			xhr.responseType = 'ms-stream';
		};

		internal.abortXHR = function(xhr) {
			console.log('aborting XHR and StreamReader');
			restarted = true;
			if (streamReader) {
				streamReader.abort();
				streamReader = null;
			}
			if (stream) {
				stream.msClose();
				stream = null;
			}
			orig.abortXHR(xhr);
		};
		
		internal.onXHRLoading = function(xhr) {
			console.log('transferring to StreamReader');
			// Transfer us over to the StreamReader...
			stream = xhr.response;
			xhr.onreadystatechange = null;
			if (waitingForInput) {
				waitingForInput = false;
				self.readBytes();
			}
		};
		
		internal.bytesBuffered = function() {
			if (stream) {
				return stream.bytesBuffered - bytesRead;
			} else {
				return 0;
			}
		};

		self.readBytes = function() {
			if (stream) {
				streamReader = new MSStreamReader();
				streamReader.onload = function(event) {
					var buffer = event.target.result,
						len = buffer.byteLength;
					if (len > 0) {
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
		
		internal.clearReadState = function() {
			orig.clearReadState();
			lastPosition = 0;
		};
		
		internal.onXHRLoading = function(xhr) {
			// xhr.responseText is a binary string of entire file so far
			var str = xhr.responseText;
			if (lastPosition < str.length) {
				var chunk = str.slice(lastPosition),
					buffer = stringToArrayBuffer(chunk);
				lastPosition = str.length;
				internal.bufferData(buffer);
			}
		};
		
		/*
		internal.quickSeek = function(pos) {
			var bufferedPos = pos - seekPosition;
			if (bufferedPos < 0) {
				return false;
			} else if (bufferedPos >= internal.xhr.responseText.length) {
				return false;
			} else {
				lastPosition = bufferedPos;
				bytesRead = lastPosition;
				setTimeout(function() {
					onbuffer()
				}, 0);
				return true;
			}
		};
		*/
	} else {
		throw new Error("No streaming HTTP input method found.");
	}
	
	internal.getMetadata();
}
