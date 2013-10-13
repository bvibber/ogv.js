(function() {

	var codec, audioFeeder;
	
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

	var benchmarkData = [],
		benchmarkDirty = false;
	function clearBenchmark() {
		benchmarkData = [];
		benchmarkDirty = true;
	}
	function recordBenchmarkPoint(ms) {
		benchmarkData.push(ms);
		benchmarkDirty = true;
	}
	function showBenchmark() {
		if (!benchmarkDirty) {
			return;
		}
		benchmarkDirty = false;

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
				page = firstPageInApiResult(data);
			if (page && ('imageinfo' in page) && 'transcodestatus' in page) {
				// yay
			} else {
				console.log("Skipping missing image data");
				console.log(page);
				return;
			}
				
			var imageinfo = page.imageinfo[0],
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
					ondone();
				}
			};
			xhr.onprogress = function(event) {
				onread(xhr.response);
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
		
		this.abort = function() {
			xhr.abort();
		};
	}
	
	function AudioFeeder(channels, rate) {
		// assume W3C Audio API
		
		var AudioContext = window.AudioContext || window.webkitAudioContext;
		if (!AudioContext) {
			// stub it out
			console.log("No W3C Web Audio API available");
			this.bufferData = function(samplesPerChannel) {};
			this.close = function() {};
			return;
		}
		
		
		var context = window.audioContext = new AudioContext(),
			bufferSize = 1024,
			node = window.audioNode = context.createScriptProcessor(bufferSize, 0, 2),
			buffers = [];
		
		function popNextBuffer() {
			// hack hack
			// fixme: grab the right number of samples
			// and... rescale 
			if (buffers.length > 0) {
				return buffers.shift();
			}
		}

		window.p = 0;
		node.onaudioprocess = function(event) {
			window.p++;
			var inputBuffer = popNextBuffer(bufferSize);
			if (inputBuffer) {
				for (var channel = 0; channel < channels; channel++) {
					var input = inputBuffer[channel],
						output = event.outputBuffer.getChannelData(channel);
					for (var i = 0; i < Math.min(bufferSize, input.length); i++) {
						output[i] = input[i];
					}
				}
			} else {
				//console.log("Starved for audio!");
				for (var channel = 0; channel < channels; channel++) {
					var output = event.outputBuffer.getChannelData(channel);
					for (var i = 0; i < bufferSize; i++) {
						output[i] = 0;
					}
				}
			}
		};
		node.connect(context.destination);
		
		var self = this;
		this.bufferData = function(samplesPerChannel) {
			if (buffers) {
				buffers.push(samplesPerChannel);
			} else {
				self.close();
			}
		};
		
		this.close = function() {
			console.log('CLOSING AUDIO');
			if (node) {
				node.onaudioprocess = null;
				node.disconnect();
			}
			node = null;
			context = null;
			buffers = null;
		};
	}

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitAnimationFrame;
	function scheduleNextTick(func, targetDelay) {
		if (targetDelay > 16) {
			window.setTimeout(func, targetDelay);
		} else if (targetDelay > 0) {
			requestAnimationFrame(func);
		} else {
			// cheat since we know this happens at the end of an event handler
			func();
		}
	}

	var player = document.getElementById('player'),
		canvas = player.querySelector('canvas'),
		//nativePlayer = document.getElementById('native'),
		//nativeVideo = nativePlayer.querySelector('video'),
		ctx = canvas.getContext('2d'),
		videoChooser = document.getElementById('video-chooser'),
		selectedTitle = null,
		selectedUrl = null;
	
	var mediaList = document.getElementById('media-list'),
		filter = document.getElementById('filter');

	function getDefault() {
		if (document.location.hash.length > 1) {
			var title;
			document.location.hash.slice(1).split('&').forEach(function(pair) {
				console.log(pair);
				var parts = pair.split('='),
					name = decodeURIComponent(parts[0]),
					value = decodeURIComponent(parts[1]);
				if (name === 'file') {
					title = value;
				} else if (name === 'search') {
					filter.value = value;
				}
			});
			if (title) {
				return 'File:' + title;
			}
		}
		return 'File:Thresher-Sharks-Use-Tail-Slaps-as-a-Hunting-Strategy-pone.0067380.s003.ogv';
	}

	function showChooser() {
		setHash();
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
		
		mediaList.innerHTML = '';
				
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
					if (page.imageinfo) {
						var imageinfo = page.imageinfo[0];
						mediaItems[page.title] = imageinfo;
					}
				}
			}
			selection.forEach(function(title) {
				var imageinfo = mediaItems[title];
				if (imageinfo) {
					addMediaSelector(title, imageinfo);
				}
			});
		});
	}
	filter.addEventListener('change', showChooser);
	filter.addEventListener('delete', showChooser);
	filter.addEventListener('cut', showChooser);
	filter.addEventListener('paste', showChooser);
	window.addEventListener('hashchange', function() {
		var oldTitle = selectedTitle,
			oldFilter = filter.value;
		selectedTitle = getDefault();
		if (oldTitle != selectedTitle) {
			showVideo();
		}
		if (oldFilter != filter.value) {
			showChooser();
		}
	});
	
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
			selectedTitle = title;
			setHash();
			showVideo();
		});

		mediaList.appendChild(item);
	}

	function setHash() {
		var hash = "#file=" + encodeURIComponent(selectedTitle.replace("File:", "").replace(/ /g, '_'));
		
		if (filter.value != '') {
			hash += '&search=' + encodeURIComponent(filter.value);
		}
		
		document.location.hash = hash;
	}
		
	function showVideo() {
		window.scrollTo(0, 0);
		
		var pagelink = document.getElementById('pagelink');
		pagelink.innerHTML = 'Open this file on Wikimedia Commons';
		pagelink.href = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(selectedTitle);
		findSourcesForMedia(selectedTitle, function(sources) {
			// Find the smallest ogv stream
			var selected = null, oga = null;
			sources.forEach(function(source) {
				if (source.format == 'ogv') {
					if (selected == null) {
						selected = source;
					} else {
						if (source.height < selected.height) {
							selected = source;
						}
					}
				} else if (source.format == 'oga') {
					oga = source;
				}
			});
			if (selected == null) {
				console.log("Try audio-only .oga transcode");
				selected = oga;
			}
			if (selected == null) {
				throw new Error("No ogv or oga source found.");
			}
			
			selectedUrl = selected.url;
			console.log("Going to try streaming data from " + selectedUrl);

			canvas.width = selected.width;
			canvas.height = selected.height;
			
			//nativeVideo.width = selected.width;
			//nativeVideo.height = selected.height;
			//nativeVideo.src = selectedUrl;
			
			playVideo();
		});
	}
	
	var selectedTitle = getDefault();
	showChooser();
	showVideo();

	var stream;	
	
	function stopVideo() {
		if (codec) {
			// kill the previous video if any
			if (stream) {
				stream.abort();
				stream = null;
			}
			codec.destroy();
			codec = null;

			if (audioFeeder) {
				audioFeeder.close();
				audioFeeder = null;
			}
		}
	}
	
	function playVideo() {
		stopVideo();
		clearBenchmark();

		var status = document.getElementById('status-view');
		status.className = 'status-invisible';
		status.innerHTML = '';

		function errorHandler(event) {
			if (stream) {
				stream.abort();
				stream = null;
			}
			var str;
			if ('message' in event) {
				str = event.message;
			} else {
				str = "halted due to script error";
			}
			status.className = 'status-visible';
			status.innerHTML = '';
			status.appendChild(document.createTextNode(str));
			console.log(event);
		}
		window.addEventListener('error', errorHandler);

		var fps = 60;

		document.getElementById('video-fps').textContent = '';
		document.getElementById('video-frame-width').textContent = '';
		document.getElementById('video-frame-height').textContent = '';
		document.getElementById('video-pic-width').textContent = '';
		document.getElementById('video-pic-height').textContent = '';
		document.getElementById('video-pic-x').textContent = '';
		document.getElementById('video-pic-y').textContent = '';
		codec = new OgvJs(canvas);
		codec.oninitvideo = function(info) {
			fps = info.fps;
			document.getElementById('video-fps').textContent = info.fps;
			document.getElementById('video-frame-width').textContent = info.frameWidth;
			document.getElementById('video-frame-height').textContent = info.frameHeight;
			document.getElementById('video-pic-width').textContent = info.picWidth;
			document.getElementById('video-pic-height').textContent = info.picHeight;
			document.getElementById('video-pic-x').textContent = info.picX;
			document.getElementById('video-pic-y').textContent = info.picY;
		}
		document.getElementById('audio-channels').textContent = '';
		document.getElementById('audio-rate').textContent = '';
		codec.oninitaudio = function(info) {
			document.getElementById('audio-channels').textContent = info.channels;
			document.getElementById('audio-rate').textContent = info.rate;
			if (audioFeeder) {
				audioFeeder.close();
			}
			audioFeeder = new AudioFeeder(info.channels, info.rate);
		}
		codec.onaudio = function(samplesPerChannel) {
			audioFeeder.bufferData(samplesPerChannel);
		};

		var lastFrameTime = getTimestamp(),
			frameScheduled = false;

		function process(callback) {
			if (!codec.frameReady) {
				var start = getTimestamp();
				while (more = codec.process()) {
					// Process until we run out of data or
					// completely decode a video frame...
					if (codec.frameReady) {
						break;
					}
				}
				recordBenchmarkPoint(getTimestamp() - start);
			}
			
			if (codec.frameReady && !frameScheduled) {
				frameScheduled = true;
				targetTime = lastFrameTime + (1000.0 / fps);
				targetDelay = Math.max(0, targetTime - getTimestamp());
				scheduleNextTick(function() {
					lastFrameTime = getTimestamp();
					if (codec && codec.frameReady) {
						var frame = codec.dequeueFrame();
						ctx.putImageData(frame, 0, 0);
						frameScheduled = false;
						if (callback) {
							callback();
						}
					}
				}, targetDelay);
			}
		}
		function processAfterRead() {
			process(function() {
				// Schedule another frame read, if we have more
				processAfterRead();
			});
		}
		
		stream = new StreamFile({
			url: selectedUrl,
			onread: function(data) {
				// Pass chunk into the codec's buffer
				codec.receiveInput(data);
				
				// Continue processing until frames run out...
				processAfterRead();
			},
			ondone: function() {
				console.log("reading done.");
				window.removeEventListener('error', errorHandler);
				
				process();
				stream = null;
			},
			onerror: function(err) {
				console.log("reading encountered error: " + err);
				window.removeEventListener('error', errorHandler);
				stream = null;
			}
		});
	}
	player.querySelector('.play').addEventListener('click', playVideo);
	player.querySelector('.stop').addEventListener('click', stopVideo);

	//nativePlayer.querySelector('.play').addEventListener('click', function() {
	//	nativeVideo.play();
	//}
	
	window.setInterval(function() {
		if (benchmarkData.length > 0) {
			showBenchmark();
		}
	}, 1000);

})();
