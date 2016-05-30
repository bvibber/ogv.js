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
		seekPosition = options.seekPosition || 0,
		bufferPosition = seekPosition,
		chunkSize = options.chunkSize || 1024 * 1024, // read/buffer up to a megabyte at a time
		waitingForInput = false,
		doneBuffering = false,
		bytesTotal = 0,
		buffers = [],
		cachever = 0,
		responseHeaders = {};



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
			if (xhr.status == 206) {
				bytesTotal = internal.getXHRRangeTotal(xhr);
			} else {
				var contentLength = xhr.getResponseHeader('Content-Length');
				if (contentLength === null || contentLength === '') {
					// Unknown file length... maybe streaming live?
					bytesTotal = 0;
				} else {
					bytesTotal = parseInt(contentLength, 10);
				}
			}
		},

		// Save HTTP response headers from the HEAD request for later
		processResponseHeaders: function(xhr) {
			responseHeaders = {};
			var allResponseHeaders = xhr.getAllResponseHeaders(),
				headerLines = allResponseHeaders.split(/\n/);
			headerLines.forEach(function(line) {
				var bits = line.split(/:\s*/, 2);
				if (bits.length > 1) {
					var name = bits[0].toLowerCase(),
						value = bits[1];
					responseHeaders[name] = value;
				}
			});
		},

		openXHR: function() {
			var getUrl = url;
			if (cachever) {
				//
				// Safari sometimes messes up and gives us the wrong chunk.
				// Seems to be a general problem with Safari and cached XHR ranges.
				//
				// Interestingly, it allows you to request _later_ ranges successfully,
				// but when requesting _earlier_ ranges it returns the latest one retrieved.
				// So we only need to update the cache-buster when we rewind.
				//
				// https://bugs.webkit.org/show_bug.cgi?id=82672
				//
				getUrl += '?ogvjs_cachever=' + cachever;
			}

			var xhr = internal.xhr = new XMLHttpRequest();
			xhr.open("GET", getUrl);

			internal.setXHROptions(xhr);

			var range = null;
			if (seekPosition || chunkSize) {
				range = 'bytes=' + seekPosition + '-';
			}
			if (chunkSize) {
				if (bytesTotal) {
					range += Math.min(seekPosition + chunkSize, bytesTotal) - 1;
				} else {
					range += (seekPosition + chunkSize) - 1;
				}
			}
			if (range !== null) {
				xhr.setRequestHeader('Range', range);
			}

			xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 2) {
					if (xhr.status == 206) {
						var foundPosition = internal.getXHRRangeStart(xhr);
						if (seekPosition != foundPosition) {
							//
							// Safari sometimes messes up and gives us the wrong chunk.
							// Seems to be a general problem with Safari and cached XHR ranges.
							//
							// Interestingly, it allows you to request _later_ ranges successfully,
							// but when requesting _earlier_ ranges it returns the latest one retrieved.
							// So we only need to update the cache-buster when we rewind and actually
							// get an incorrect range.
							//
							// https://bugs.webkit.org/show_bug.cgi?id=82672
							//
							console.log('Expected start at ' + seekPosition + ' but got ' + foundPosition +
								'; working around Safari range caching bug: https://bugs.webkit.org/show_bug.cgi?id=82672');
							cachever++;
							internal.abortXHR(xhr);
							internal.openXHR();
							return;
						}
					}
					if (xhr.status >= 400) {
						onerror('HTTP error; status code ' + xhr.status);
						return;
					}
					if (!started) {
						internal.setBytesTotal(xhr);
						internal.processResponseHeaders(xhr);
						started = true;
						onstart();
					}
					//internal.onXHRHeadersReceived(xhr);
					// @todo check that partial content was supported if relevant
				} else if (xhr.readyState == 3) {
					internal.onXHRLoading(xhr);
				} else if (xhr.readyState == 4) {
					// Complete.
					internal.onXHRDone(xhr);
					internal.onXHRLoading(xhr);
				}
			};

			xhr.send();
		},

		getXHRRangeMatches: function(xhr) {
			// Note Content-Range must be whitelisted for CORS requests
			var contentRange = xhr.getResponseHeader('Content-Range');
			return contentRange && contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)/);
		},

		getXHRRangeStart: function(xhr) {
			var matches = internal.getXHRRangeMatches(xhr);
			if (matches) {
				return parseInt(matches[1], 10);
			} else {
				return 0;
			}
		},

		getXHRRangeTotal: function(xhr) {
			var matches = internal.getXHRRangeMatches(xhr);
			if (matches) {
				return parseInt(matches[3], 10);
			} else {
				return 0;
			}
		},

		setXHROptions: function(xhr) {
			throw new Error('abstract function');
		},

		/*
		onXHRHeadersReceived: function(xhr) {
			if (xhr.status >= 400) {
				// errrorrrrrrr
				console.log("HTTP " + xhr.status + ": " +xhr.statusText);
				onerror();
				xhr.abort();
			} else {
				internal.setBytesTotal(xhr);
				internal.processResponseHeaders(xhr);
				started = true;
				onstart();
			}
		},
		*/

		onXHRLoading: function(xhr) {
			throw new Error('abstract function');
		},

		onXHRDone: function(xhr) {
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
			return internal.bytesBuffered() > 0;
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

			var min = bufferSize;
			while (byteLength < min) {
				var needBytes = min - byteLength,
					nextBuffer = buffers.shift();
				if (!nextBuffer) {
					break;
				}
				if (!(nextBuffer instanceof ArrayBuffer)) {
					// lazy-expand if necessary
					nextBuffer = nextBuffer.getBuffer();
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

			bufferPosition += byteLength;
			return bufferOut.slice(0, byteLength);
		},

		clearReadState: function() {
			doneBuffering = false;
			waitingForInput = true;
		},

		clearBuffers: function() {
			internal.clearReadState();
			buffers.splice(0, buffers.length);
			bufferPosition = seekPosition;
		},

		// Read the next binary buffer out of the buffered data
		readNextChunk: function() {
			if (waitingForInput) {
				waitingForInput = false;
				onread(internal.popBuffer());
			}
		},

		onReadDone: function() {
			ondone();
		},

		// See if we can seek within already-buffered data
		quickSeek: function(pos) {
			return false;
		}

	};

	// -- Public methods
	self.readBytes = function() {
		if (waitingForInput) {
			throw new Error('Re-entrancy fail in StreamFile.readyBytes while waiting');
		}
		function advance() {
			if (doneBuffering && self.bytesBuffered < Math.min(bufferPosition + chunkSize, self.bytesTotal)) {
				seekPosition += chunkSize;
				internal.clearReadState();
				internal.openXHR();
				waitingForInput = false;
				return true;
			} else {
				return false;
			}
		}
		if (internal.dataToRead()) {
			var buffer = internal.popBuffer();
			advance();
			onread(buffer);
		} else if (doneBuffering) {
			// We're out of data!
			if (!advance()) {
				internal.onReadDone();
			}
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
			waitingForInput = false;
		}
	};

	self.seek = function(bytePosition) {
		if (internal.quickSeek(bytePosition)) {
			//console.log('quick seek successful');
		} else {
			self.abort();
			seekPosition = bytePosition;
			internal.clearBuffers();
			internal.openXHR();
		}
	};

	self.getResponseHeader = function(headerName) {
		var lowerName = headerName.toLowerCase(),
			value = responseHeaders[lowerName];
		if (value === undefined) {
			return null;
		} else {
			return value;
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
			return bufferPosition + internal.bytesBuffered();
		}
	});

	Object.defineProperty(self, 'bytesRead', {
		get: function() {
			return bufferPosition;
		}
	});

	Object.defineProperty(self, 'seekable', {
		get: function() {
			return (self.bytesTotal > 0);
		}
	});

	// Handy way to call super functions
	var orig = {};
	for (var prop in internal) {
		orig[prop] = internal[prop];
	}

	// -- Backend selection and method overrides
	if (internal.tryMethod('moz-chunked-arraybuffer')) {
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

		// Don't bother reading in chunks, MSStream handles it for us
		chunkSize = 0;

		var stream, streamReader;
		var restarted = false;

		internal.setXHROptions = function(xhr) {
			xhr.responseType = 'ms-stream';
		};

		internal.abortXHR = function(xhr) {
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
			// Transfer us over to the StreamReader...
			stream = xhr.response;
			xhr.onreadystatechange = null;
			if (waitingForInput) {
				waitingForInput = false;
				self.readBytes();
			}
		};

		internal.bytesBuffered = function() {
			// We don't know how much ahead is buffered, it's opaque.
			// Just return what we've read.
			return 0;
		};

		self.readBytes = function() {
			if (stream) {
				// Save the current position in case the stream died
				// and we have to restart it...
				var currentPosition = self.bytesRead;

				var reader = streamReader = new MSStreamReader();
				reader.onload = function(event) {
					var buffer = event.target.result,
						len = buffer.byteLength;
					if (len > 0) {
						bufferPosition += len;
						onread(buffer);
					} else {
						// Zero length means end of stream.
						ondone();
					}
				};
				reader.onerror = function(event) {
					console.log('MSStreamReader error: ' + reader.error + '; trying to recover');
					self.seek(currentPosition);
					self.readBytes();
				};
				streamReader.readAsArrayBuffer(stream, bufferSize);
			} else {
				waitingForInput = true;
			}
		};

	} else if ((new XMLHttpRequest()).overrideMimeType !== undefined) {

		// Use old binary string method since we can read reponseText
		// progressively and extract ArrayBuffers from that.

		internal.setXHROptions = function(xhr) {
			xhr.responseType = "text";
			xhr.overrideMimeType('text/plain; charset=x-user-defined');
		};

		var lastPosition = 0;

		// Is there a better way to do this conversion? :(
		var stringToArrayBuffer = function(chunk) {
			var len = chunk.length,
				buffer = new ArrayBuffer(len),
				bytes = new Uint8Array(buffer);
			for (var i = 0; i < len; i++) {
				bytes[i] = chunk.charCodeAt(i);
			}
			return buffer;
		};

		// Wrapper for buffers, to let us lazy-extract the binary data
		function StringBufferWrapper(xhr, start, end) {
			this.start = start;
			this.end = end;
			this.byteLength = end - start;
			this.xhr = xhr;
		}
		StringBufferWrapper.prototype.getBuffer = function() {
			var str = this.xhr.responseText,
				chunk = str.slice(this.start, this.end),
				buffer = stringToArrayBuffer(chunk);
			return buffer;
		};

		internal.clearReadState = function() {
			orig.clearReadState();
			lastPosition = 0;
		};

		internal.onXHRLoading = function(xhr) {
			// xhr.responseText is a binary string of entire file so far
			var str = xhr.responseText;
			if (lastPosition < str.length) {
				var buffer = new StringBufferWrapper(xhr, lastPosition, str.length);
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

	internal.openXHR();
}

module.exports = StreamFile;
