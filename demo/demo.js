(function() {

	var codec;

	/**
	 * dictionary -> URL query string params
	 */
	function arrayToCgi(params) {
		var components = [];
		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				pair = encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
				components[components.length] = pair;
			}
		}
		return components.join('&');
	}
	
	/**
	 * Make a call to Commons API over JSONP
	 *
	 * @param object params
	 * @param function(jsonData) callback
	 */
	function commonsApi(params, callback) {
		var callbackId = 'jsonpCallback' + (Math.random() + '').replace('.', '');
		window[callbackId] = function(data) {
			window[callbackId] = undefined;
			callback(data);
		};
		var baseUrl = 'https://commons.wikimedia.org/w/api.php';
		var url = baseUrl + '?' + arrayToCgi(params) + '&format=json&callback=' + callbackId;

		// Whee jsonp load
		var script = document.createElement('script');
		script.src = url;
		document.querySelector('head').appendChild(script);
	}
	
	
	function getExtension(filename) {
		var matches = filename.match(/\.([^\.]+)$/);
		if (matches) {
			return matches[1].toLowerCase();
		} else {
			throw new Error("uhhhh no extension on " + filename);
		}
	}
	
	function firstPageInApiResult(data) {
		var pages = data.query.pages;
		for (var id in pages) {
			if (pages.hasOwnProperty(id)) {
				return pages[id];
			}
		}
		throw new Error("waaaah no pages in pages");
	}
	
	/**
	 * Guesstimate the transcoded resource URL from the original.
	 *
	 * It would be preferable to get this direct from API,
	 * filed request as https://bugzilla.wikimedia.org/show_bug.cgi?id=55622
	 *
	 * @param String url
	 * @param number height
	 * @param String format
	 */
	function transcodeUrl(url, height, format) {
		var matches = url.match(/^(.*)\/(.\/..)\/(.*?)$/),
			baseUrl = matches[1],
			hash = matches[2],
			filename = matches[3];
		return baseUrl + '/transcoded/' + hash + '/' + filename + '/' + filename + '.' + height + 'p.' + format;
	}
	
	/**
	 * @param String media
	 * @param function([{format, title, width, height, url}]) callback
	 */
	function findSourcesForMedia(media, callback) {
		commonsApi({
			action: 'query',
			prop: 'imageinfo|transcodestatus',
			titles: 'File:' + media,
			iiprop: 'url|size'
		}, function(data, err) {

			var sources = [],
				page = firstPageInApiResult(data),
				imageinfo = page.imageinfo[0],
				transcodestatus = page.transcodestatus;
			
			// Build an entry for the original media
			var ext = getExtension(imageinfo.url),
				format;
			if (ext == 'ogg') {
				format = 'ogv'; // todo: check video/audioness
			} else if (ext == 'ogv') {
				format = 'ogv';
			} else if (ext == 'oga') {
				// uhhhh.
				format = 'oga';
			} else if (ext == 'webm') {
				format = 'webm';
			} else {
				throw new Error("Unexpected file extension " + ext);
			}
			sources.push({
				format: format,
				width: imageinfo.width,
				height: imageinfo.height,
				url: imageinfo.url,
				bitrate: 0 // todo: calculate
			});
			
			// Build entries for the transcodes
			for (var key in transcodestatus) {
				if (transcodestatus.hasOwnProperty(key)) {
					var transcode = transcodestatus[key];
					if (transcode.time_success != '') {
						var format, height, matches;
						matches = key.match(/^(\d+)p\.(.*?)$/);
						if (matches) {
							var height = parseInt(matches[1]),
								format = matches[2];
							sources.push({
								format: format,
								width: Math.round(imageinfo.width * height / imageinfo.height),
								height: height,
								url: transcodeUrl(imageinfo.url, height, format),
								bitrate: parseInt(transcode.final_bitrate)
							});
						} else {
							throw new Error("unexpected transcode key name: " + key);
						}
					}
				}
			}
			
			callback(sources);
		});
	}

	/**
	 * Quickie wrapper around XHR to fetch a file as array buffer chunks.
	 * Does not yet actually deliver during download, however.
	 * Safari doesn't seem to currently support a streaming/progressive
	 * XHR option that I can see. :( May have to do multiple partial reqs.
	 */
	function StreamFile(options) {
		var url = options.url,
			onread = options.onread,
			ondone = options.ondone,
			onerror = options.onerror,
			bufferSize = options.bufferSize || 1024 * 1024;
		
		function fetchLength(callback) {
			callback(bufferSize, null);
			return;
			//
			var xhr = new XMLHttpRequest();
			xhr.open("HEAD", url);
			xhr.onreadystatechange = function(event) {
				if (xhr.readyState == 2) {
					if (xhr.status >= 400) {
						// errrorrrrrrr
						var err = "HTTP " + xhr.status + ": " + xhr.statusText;
						xhr.abort();
						callback(null, err);
					}
				} else if (xhr.readyState == 4) {
					var len = null,
						err = null,
						lengthHeader = xhr.getResponseHeader('Content-Length');

					if (lengthHeader == null) {
						err = "could not get Content-Length header";
					} else {
						try {
							len = parseInt(lengthHeader);
						} catch (e) {
							err = "Content-Length value not an integer";
						}
					}
					callback(len, err);
				}
			};
			xhr.send();
		}
		
		fetchLength(function(fileLength, err) {
			var lastPosition = 0,
				useRange;
			if (err) {
				// Preflight OPTIONS fails in Safari, IE?
				useRange = false;
				fileLength = 0;
				console.log("Can't use range requests -- fetching full file :(");
			} else {
				// Preflight w/ Range won't work -- https://bugzilla.wikimedia.org/show_bug.cgi?id=55622
				useRange = false;
			}

			function fetchChunk(position, callback) {
				var xhr = new XMLHttpRequest();
				xhr.open("GET", url);
				xhr.responseType = "arraybuffer";
				xhr.onreadystatechange = function(event) {
					if (xhr.readyState == 2) {
						if (xhr.status >= 400) {
							// errrorrrrrrr
							callback(null, "HTTP " + xhr.status + ": " +xhr.statusText);
							onerror();
							xhr.abort();
						}
					} else if (xhr.readyState == 4) {
						callback(xhr.response, null);
					}
				};
				if (useRange) {
					xhr.setRequestHeader("range", "bytes=" + position + "-" + endPosition);
					var endPosition = position + bufferSize;
					if (endPosition >= fileLength) {
						// Don't try to request past the end of the file!
						endPosition = fileLength - 1;
					}
					xhr.send();
				} else if (position > 0) {
					callback(null, "Can't fetch more chunks without CORS range support");
				} else {
					xhr.send();
				}
			}
	
			function process() {
				fetchChunk(lastPosition, function(data, err) {
					if (data) {
						console.log("chunk read: " + data.byteLength);
						onread(data);

						// fixme cleanly handle running out of data, call ondone()
						lastPosition += data.byteLength;
						if (lastPosition >= fileLength) {
							ondone();
						} else {
							process();
						}
					} else {
						console.log("chunk fail: " + err);
						onerror(err);
					}
				});
			}

			process();
		});
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
		ctx = canvas.getContext('2d'),
		videoChooser = document.getElementById('video-chooser');
	
	function showSelectedVideo() {
		var filename = videoChooser.value;
		findSourcesForMedia(filename, function(sources) {
			// Find the smallest ogv stream
			var selected = null;
			sources.forEach(function(source) {
				if (source.format == 'ogv') {
					if (selected == null) {
						selected = source;
					} else {
						if (source.height < selected.height) {
							selected = source;
						}
					}
				}
			});
			if (selected == null) {
				throw new Error("No ogv source found.");
			}
			
			var url = selected.url;
			console.log("Going to try streaming data from " + url);

			if (codec) {
				// kill the previous video if any
				codec.destroy();
			}

			canvas.width = selected.width;
			canvas.height = selected.height;

			codec = new OgvJs(canvas);
			codec.onframe = function(imageData) {
				ctx.putImageData(imageData, 0, 0);
			};

			var stream = new StreamFile({
				url: url,
				onread: function(data) {
					codec.receiveInput(data);
					function pingProcess() {
						if (codec.process()) {
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
		});
	}
	videoChooser.addEventListener('change', showSelectedVideo);
	showSelectedVideo();

})();
