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
		benchmarkDirty = false,
		benchmarkTargetFps = 0;
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
			fpsTarget = (benchmarkTargetFps ? (1000.0 / benchmarkTargetFps) : fps30),
			maxTime = Math.max(fpsTarget, fps30),
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
		
		if (benchmarkTargetFps) {
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(x(0), y(fpsTarget));
			ctx.lineTo(x(maxItems - 1), y(fpsTarget));
			ctx.stroke();
		}

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

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
	function scheduleNextTick(func, targetDelay) {
		if (targetDelay > 16) {
			window.setTimeout(func, targetDelay);
		} else {
			requestAnimationFrame(func);
		}
	}

	var player = document.getElementById('player'),
		controls = document.getElementById('controls'),
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
				var parts = pair.split('='),
					name = decodeURIComponent(parts[0]),
					value = decodeURIComponent(parts[1]);
				if (name === 'file') {
					title = value;
				} else if (name === 'search') {
					filter.value = value;
				} else if (name === 'mute') {
					document.getElementById('mute').checked = (value == '1');
				}
			});
			if (title) {
				return 'File:' + title;
			}
		}
		return 'File:Jarry - Métro de Montréal (640×360).ogv';
	}

	function dismissChooser() {
		document.getElementById('media-chooser-stub').className = '';
		document.getElementById('media-chooser').className = '';
	}
	document.getElementById('media-chooser-stub').addEventListener('click', function() {
		dismissChooser();
	});
	function showChooser() {
		setHash();
		
		document.getElementById('media-chooser-stub').className = 'active';
		document.getElementById('media-chooser').className = 'active';
		
		var filterString = filter.value.toLowerCase();
		
		var max = 40, list = [];
		for (var day in motd) {
			if (motd.hasOwnProperty(day)) {
				var title = motd[day];
				if (filterString == '' || title.toLowerCase().indexOf(filterString) != -1) {
					list.push('File:' + motd[day]);
				}
			}
		}
		var selection = list.reverse().slice(0, max);
		
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
	filter.addEventListener('focus', showChooser);
	window.addEventListener('hashchange', function() {
		var oldTitle = selectedTitle,
			oldFilter = filter.value;
		selectedTitle = getDefault();
		if (oldTitle != selectedTitle) {
			showVideo();
		}
		if (oldFilter != filter.value && document.getElementById('media-chooser').className == 'active') {
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
			dismissChooser();
			showVideo();
		});

		mediaList.appendChild(item);
	}

	function setHash() {
		var hash = "#file=" + encodeURIComponent(selectedTitle.replace("File:", "").replace(/ /g, '_'));
		
		if (filter.value != '') {
			hash += '&search=' + encodeURIComponent(filter.value);
		}
		
		if (document.getElementById('mute').checked) {
			hash += '&mute=1';
		}
		
		document.location.hash = hash;
	}
	
	function resizeVideo() {
		var container = document.getElementById('player'),
			computedStyle = window.getComputedStyle(container),
			containerWidth = parseInt(computedStyle.getPropertyValue('width')),
			containerHeight = parseInt(computedStyle.getPropertyValue('height'));

		var width = containerWidth,
			height = canvas.height * width / canvas.width,
			top = 0;

		if (height > containerHeight) {
			height = containerHeight;
			width = canvas.width * height / canvas.height;
		} else {
			top = Math.round((containerHeight - height) / 2);
		}
		
		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';
		canvas.style.marginTop = top + 'px';
	}
	window.addEventListener('resize', resizeVideo);
	
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
			resizeVideo();
			
			//nativeVideo.width = selected.width;
			//nativeVideo.height = selected.height;
			//nativeVideo.src = selectedUrl;
			
			playVideo();
		});
	}
	
	var selectedTitle = getDefault();
	//showChooser();
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
	
	var canTransfer = undefined,
		colorConverter = new Worker('YCbCr-worker.js'),
		colorConverterCallbacks = [],
		colorConverterCallbackLastId = 1;
	colorConverter.addEventListener('message', function(event) {
		var data = event.data;
		if (data.action == 'result:convertYCbCr') {
			var callback = colorConverterCallbacks[data.id];
			colorConverterCallbacks[data.id] = undefined;
			callback(data.buffer);
		} else {
			throw new Error("Received unexpected result: " + data.action);
		}
	});
	function deferredColorConversion(buffer, width, height, hdec, vdec, callback) {
		var id = ++colorConverterCallbackLastId;
		colorConverterCallbacks[id] = callback;
		var packet = {
			action: 'convertYCbCr',
			id: id,
			buffer: buffer,
			width: width,
			height: height,
			hdec: hdec,
			vdec: vdec
		};
		if (canTransfer === true) {
			colorConverter.postMessage(packet, [buffer]);
		} else if (canTransfer === false) {
			colorConverter.postMessage(packet);
		} else {
			try {
				colorConverter.postMessage(packet, [buffer]);
			} catch (e) {
				// IE 10/11 throw an exception if you try to
				// transfer an ArrayBuffer. This is annoying.
				console.log('Cannot transfer ArrayBuffers specifically across threads!');
				colorConverter.postMessage(packet);
			}
			if (buffer.byteLength == 0) {
				canTransfer = true;
				console.log('Can transfer objects across threads, yay!');
			} else {
				canTransfer = false;
				console.log('Cannot transfer objects across threads, boo');
			}
		}
	}
	
	function playVideo() {
		stopVideo();
		clearBenchmark();

		var status = document.getElementById('status-view');
		status.className = 'status-invisible';
		status.innerHTML = '';

		function showStatus(str) {		
			status.className = 'status-visible';
			status.innerHTML = '';
			status.appendChild(document.createTextNode(str));
		}
		
		function errorHandler(event) {
			if (stream) {
				stream.abort();
				stream = null;
			}
			var str;
			if ('message' in event) {
				str = event.message;
			} else {
				str = "unknown script error";
			}
			showStatus(str);
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
		var videoInfo,
			imageData,
			options = {};
		
		// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/536.30.1 (KHTML, like Gecko) Version/6.0.5 Safari/536.30.1
		if (navigator.userAgent.match(/Version\/6\.0\.[0-9a-z.]+ Safari/)) {
			// Something may be wrong with the JIT compiler in Safari 6.0;
			// when we decode Vorbis with the debug console closed it falls
			// into 100% CPU loop and never exits.
			//
			// Blacklist audio decoding for this browser.
			//
			// Known working in Safari 6.1 and 7.
			options.audio = false;
			showStatus('Audio disabled due to bug on Safari 6.0');
		}
		
		codec = new OgvJs(options);
		codec.oninitvideo = function(info) {
			videoInfo = info;
			fps = info.fps;
			benchmarkTargetFps = info.fps;

			canvas.width = info.picWidth;
			canvas.height = info.picHeight;
			imageData = ctx.createImageData(info.frameWidth, info.frameHeight);

			resizeVideo();

			document.getElementById('video-fps').textContent = (Math.round(info.fps * 100) / 100);
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
			if (audioFeeder.stub === true) {
				showStatus('No audio support in browser.');
				document.getElementById('mute').disabled = true;
			} else {
				document.getElementById('mute').disabled = false;
			}
			if (document.getElementById('mute').checked) {
				audioFeeder.mute();
			}
		}
		codec.onaudio = function(samplesPerChannel) {
			audioFeeder.bufferData(samplesPerChannel);
		};

		var lastFrameTime = getTimestamp(),
			frameScheduled = false,
			imageData = null;

		function process() {
			var start = getTimestamp();
			// Process until we run out of data or
			// completely decode a video frame...
			while (!codec.frameReady) {
				more = codec.process();
				if (!more) {
					// Ran out of input
					stream.readBytes();
					break;
				}
			}
			recordBenchmarkPoint(getTimestamp() - start);
			
			if (codec.frameReady && !frameScheduled) {
				frameScheduled = true;
				targetTime = lastFrameTime + (1000.0 / fps);
				targetDelay = Math.max(0, targetTime - getTimestamp());
				scheduleNextTick(function Player_drawYCbCrFrame() {
					lastFrameTime = getTimestamp();
					if (codec && codec.frameReady) {
						var yCbCrBuffer = codec.dequeueFrame();
						// Schedule YCbCr->RGB conversion on a background thread
						deferredColorConversion(yCbCrBuffer,
												videoInfo.frameWidth, videoInfo.frameHeight,
												videoInfo.hdec, videoInfo.vdec,
												function Player_drawRgbFrame(rgbBuffer) {
							
							var rgbBytes = new Uint8Array(rgbBuffer),
								outputBuffer = imageData.data;
						
							if (outputBuffer.set) {
								outputBuffer.set(rgbBytes);
							} else {
								// IE 10 & 11 still use old CanvasPixelArray, which is
								// not interoperable with new typed arrays.
								// We must copy it all byte by byte!
								var max = videoInfo.frameWidth * videoInfo.frameHeight * 4;
								for (var i = 0; i < max; i++) {
									outputBuffer[i] = rgbBytes[i];
								}
							}

							ctx.putImageData(imageData,
											 0, 0,
											 videoInfo.picX, videoInfo.picY,
											 videoInfo.picWidth, videoInfo.picHeight);
						});
						frameScheduled = false;

						if (stream) {
							setTimeout(function() {
								// Schedule the next processing.
								// Don't do it *during* requestAnimationFrame scheduling!
								process();
							}, 0);
						}
					}
				}, targetDelay);
			}
		}
		
		var totalRead = 0;
		
		stream = new StreamFile({
			url: selectedUrl,
			bufferSize: 65536,
			onread: function(data) {
				totalRead += data.byteLength;
				// Pass chunk into the codec's buffer
				codec.receiveInput(data);
				process();
			},
			ondone: function() {
				console.log("reading done.");
				window.removeEventListener('error', errorHandler);
				if (audioFeeder) {
					// fixme -- do this when done *decoding* not done reading
					audioFeeder.close();
					audioFeeder = null;
				}
				stream = null;
			},
			onerror: function(err) {
				console.log("reading encountered error: " + err);
				window.removeEventListener('error', errorHandler);
				if (audioFeeder) {
					audioFeeder.close();
					audioFeeder = null;
				}
				stream = null;
			}
		});
		stream.readBytes();
	}
	controls.querySelector('.play').addEventListener('click', playVideo);
	controls.querySelector('.stop').addEventListener('click', stopVideo);
	controls.querySelector('#mute').addEventListener('click', function() {
		if (codec && audioFeeder) {
			if (this.checked) {
				audioFeeder.mute();
			} else {
				audioFeeder.unmute();
			}
		}
		setHash();
	});

	//nativePlayer.querySelector('.play').addEventListener('click', function() {
	//	nativeVideo.play();
	//}
	
	window.setInterval(function() {
		if (benchmarkData.length > 0) {
			showBenchmark();
		}
	}, 1000);

})();
