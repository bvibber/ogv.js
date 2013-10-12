(function() {

	var codec;
	
	var getTimestamp;
	if (window.performance === undefined) {
		console.log("window.performance is not available; using Date.now() for benchmarking");
		getTimestamp = function() {
			return Date.now();
		}
	} else {
		console.log("window.performance is available; using window.performance.now() for benchmarking");
		getTimestamp = function() {
			return window.performance.now();
		}
	}

	var benchmarkData = [];
	function clearBenchmark() {
		benchmarkData = [];
	}
	function recordBenchmarkPoint(ms) {
		benchmarkData.push(ms);
	}
	function showBenchmark() {
		console.log(benchmarkData);
		var canvas = document.getElementById('benchmark'),
			width = canvas.width,
			height = canvas.height,
			ctx = canvas.getContext('2d'),
			i,
			fps30 = 1000.0 / 30.0,
			fps60 = 1000.0 / 60.0,
			maxTime = fps30,
			maxItems = benchmarkData.length;
		
		// Find the tallest data point
		for (i = 0; i < maxItems; i++) {
			maxTime = Math.max(maxTime, benchmarkData[i]);
		}
		
		// Draw!
		
		ctx.clearRect(0, 0, width, height);
		
		function x(i) {
			return i * (width - 1) / maxItems;
		}
		function y(ms) {
			return (height - 1) - ms * (height - 1) / maxTime;
		}
		
		ctx.beginPath();
		ctx.strokeStyle = 'green';
		ctx.moveTo(x(0), y(fps30));
		ctx.lineTo(x(maxItems - 1), y(fps30));
		ctx.stroke();
		
		ctx.beginPath();
		ctx.strokeStyle = 'blue';
		ctx.moveTo(x(0), y(fps60));
		ctx.lineTo(x(maxItems - 1), y(fps60));
		ctx.stroke();
		
		ctx.beginPath();
		ctx.strokeStyle = 'black';
		ctx.moveTo(0, (height - 1) - benchmarkData[0] * (height - 1) / maxTime);
		for (i = 1; i < maxItems; i++) {
			ctx.lineTo(x(i), y(benchmarkData[i]));
		}
		ctx.stroke();
	}
	
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
			titles: media,
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
			bufferSize = options.bufferSize || 1024 * 1024,
			lastPosition = 0;
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		
		// We really want chunked-arraybuffer for progressive streaming,
		// but it's not available except in Firefox with moz- prefix.
		// Use old binary string method since we can read reponseText
		// progressively and extract ArrayBuffers from that.
		xhr.responseType = "text";
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		
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
		xhr.send();
		
		this.abort = function() {
			xhr.abort();
		};
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
		//nativePlayer = document.getElementById('native'),
		//nativeVideo = nativePlayer.querySelector('video'),
		ctx = canvas.getContext('2d'),
		videoChooser = document.getElementById('video-chooser'),
		selectedUrl = null;
	
	var mediaList = document.getElementById('media-list'),
		filter = document.getElementById('filter');

	function showChooser() {
		var filterString = filter.value.toLowerCase();
		
		var max = 20, list = [];
		for (var day in motd) {
			if (motd.hasOwnProperty(day)) {
				var title = motd[day];
				if (filterString == '' || title.toLowerCase().indexOf(filterString) != -1) {
					list.push('File:' + motd[day]);
				}
			}
		}
		var selection = list.reverse().slice(0, max);
		console.log(selection);
		
		mediaList.innerText = '';
				
		if (selection.length == 0) {
			mediaList.appendChild(document.createTextNode('No matches'));
			return;
		}
		
		commonsApi({
			action: 'query',
			prop: 'imageinfo',
			iiprop: 'url|size',
			iiurlwidth: 128,
			iiurlheight: 128,
			titles: selection.join('|')
		}, function(data) {
			var pages = data.query.pages,
				mediaItems = {};
			for (var pageId in pages) {
				if (pages.hasOwnProperty(pageId)) {
					var page = pages[pageId];
					var imageinfo = page.imageinfo[0];
					if (imageinfo) {
						//addMediaSelector(page.title, imageinfo);
						mediaItems[page.title] = imageinfo;
					}
				}
			}
			selection.forEach(function(title) {
				var imageinfo = mediaItems[title];
				addMediaSelector(title, imageinfo);
			});
		});
	}
	filter.addEventListener('change', showChooser);
	filter.addEventListener('delete', showChooser);
	filter.addEventListener('cut', showChooser);
	filter.addEventListener('paste', showChooser);
	showChooser();
	
	function addMediaSelector(title, imageinfo) {
		var item = document.createElement('div'),
			img = document.createElement('img');
		
		item.className = 'media-item';
		
		img.src = imageinfo.thumburl;
		img.title = "Play video"
		img.width = imageinfo.thumbwidth;
		img.height = imageinfo.thumbheight;
		
		item.appendChild(img);
		item.appendChild(document.createTextNode(' ' + title.replace('File:', '').replace(/_/g, ' ')));
		item.addEventListener('click', function() {
			document.location.hash = "#" + encodeURIComponent(title.replace("File:", "").replace(/ /g, '_'));
			window.scrollTo(0, 0);
			showVideo(title);
		});

		mediaList.appendChild(item);
	}
	
	function showVideo(filename) {
		var pagelink = document.getElementById('pagelink');
		pagelink.innerText = 'Open this file on Wikimedia Commons';
		pagelink.href = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(filename);
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
			
			selectedUrl = selected.url;
			console.log("Going to try streaming data from " + selectedUrl);

			if (codec) {
				// kill the previous video if any
				codec.destroy();
				codec = null;
			}

			canvas.width = selected.width;
			canvas.height = selected.height;
			
			//nativeVideo.width = selected.width;
			//nativeVideo.height = selected.height;
			//nativeVideo.src = selectedUrl;
			
			playVideo();
		});
	}
	
	function getDefault() {
		if (document.location.hash.length > 1) {
			return 'File:' + decodeURIComponent(document.location.hash.slice(1));
		}
		return 'File:Thresher-Sharks-Use-Tail-Slaps-as-a-Hunting-Strategy-pone.0067380.s003.ogv';
	}
	showVideo(getDefault());
	
	function playVideo() {
		if (codec) {
			// kill the previous video if any
			codec.destroy();
		}
		clearBenchmark();

		var stream;
		function errorHandler() {
			if (stream) {
				stream.abort();
			}
		}
		window.addEventListener('error', errorHandler);

		codec = new OgvJs(canvas);
		codec.onframe = function(imageData) {
			ctx.putImageData(imageData, 0, 0);
		};

		var processingScheduled = false;
		function pingProcess() {
			if (!processingScheduled) {
				processingScheduled = true;

				scheduleNextTick(function() {
					processingScheduled = false;
					var start = getTimestamp();
					var more = codec.process();
					recordBenchmarkPoint(getTimestamp() - start);
					if (more) {
						pingProcess();
					} else {
						console.log("NO MORE PACKETS");
						showBenchmark();
					}
				});
			}
		}

		stream = new StreamFile({
			url: selectedUrl,
			onread: function(data) {
				// Pass chunk into the codec's buffer
				codec.receiveInput(data);
				
				// Process the next frame in the buffer on the next
				// animation redraw pass.
				pingProcess();
			},
			ondone: function() {
				console.log("reading done.");
				window.removeEventListener('error', errorHandler);
			},
			onerror: function(err) {
				console.log("reading encountered error: " + err);
				window.removeEventListener('error', errorHandler);
			}
		});
	}
	player.querySelector('.play').addEventListener('click', playVideo);

	//nativePlayer.querySelector('.play').addEventListener('click', function() {
	//	nativeVideo.play();
	//}
	

})();
