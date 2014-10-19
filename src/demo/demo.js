(function() {

	var getTimestamp;
	if (window.performance === undefined || window.performance.now === undefined) {
		console.log("window.performance.now is not available; using Date.now() for benchmarking");
		getTimestamp = Date.now;
	} else {
		console.log("window.performance.now is available; using window.performance.now() for benchmarking");
		getTimestamp = window.performance.now.bind(window.performance);
	}

	var player;
	var durationHint;
	var averageDemuxingTime = 0, // ms
		averageVideoDecodingTime = 0, // ms
		averageAudioDecodingTime = 0, // ms
		averageBufferTime = 0, // ms
		averageDrawingTime = 0; // ms

	var benchmarkData = [],
		benchmarkClockData = [],
		benchmarkDirty = false,
		benchmarkTargetFps = -1;
	function clearBenchmark() {
		benchmarkData = [];
		benchmarkClockData = [];
		benchmarkDirty = true;
	}
	function recordBenchmarkPoint(cpuTime, clockTime) {
		benchmarkData.push(cpuTime);
		benchmarkClockData.push(clockTime);
		
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
			fps60 = 1000.0 / 60.0,
			fpsTarget = (benchmarkTargetFps ? (1000.0 / benchmarkTargetFps) : fps60),
			maxTime = fpsTarget * 2,
			chunkSize = benchmarkTargetFps * 5, // show last 5 seconds
			maxItems = Math.min(chunkSize, benchmarkData.length);
		
		var clockData = benchmarkClockData.slice(-chunkSize),
			cpuData = benchmarkData.slice(-chunkSize);
		
		// Draw!
		
		ctx.clearRect(0, 0, width, height);
		
		function x(i) {
			return i * (width - 1) / maxItems;
		}
		function y(ms) {
			return (height - 1) - ms * (height - 1) / maxTime;
		}
				
		// Wall-clock time
		ctx.beginPath();
		ctx.strokeStyle = 'blue';
		ctx.moveTo(0, (height - 1) - clockData[0] * (height - 1) / maxTime);
		for (i = 1; i < maxItems; i++) {
			ctx.lineTo(x(i), y(clockData[i]));
		}
		ctx.stroke();

		// CPU time
		ctx.beginPath();
		ctx.strokeStyle = 'black';
		ctx.moveTo(0, (height - 1) - cpuData[0] * (height - 1) / maxTime);
		for (i = 1; i < maxItems; i++) {
			ctx.lineTo(x(i), y(cpuData[i]));
		}
		ctx.stroke();
		
		if (benchmarkTargetFps) {
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.moveTo(x(0), y(fpsTarget));
			ctx.lineTo(x(maxItems - 1), y(fpsTarget));
			ctx.stroke();
		}
	}
	
	function round2(n) {
		return Math.round(n * 100) / 100;
	}
	function round1_0(n) {
		var n = Math.round(n * 10) / 10,
			s = n + '';
		if (s.indexOf('.') === -1) {
			s += '.0';
		}
		return s;
	}
	function showAverageRate() {
		if (!player || !player.getPlaybackStats) {
			return;
		}
		
		var info = player.getPlaybackStats();
		if (info.framesProcessed) {
			averageDemuxingTime = info.demuxingTime / info.framesProcessed;
			averageVideoDecodingTime = info.videoDecodingTime / info.framesProcessed;
			averageAudioDecodingTime = info.audioDecodingTime / info.framesProcessed;
			averageBufferTime = info.bufferTime / info.framesProcessed;
			averageDrawingTime = info.drawingTime / info.framesProcessed;

			var targetPerFrameTime = info.targetPerFrameTime;
			benchmarkTargetFps = 1000 / targetPerFrameTime;
			document.getElementById('bench-target').textContent = round1_0(targetPerFrameTime);
			document.getElementById('bench-total').textContent = round1_0(averageDemuxingTime + averageVideoDecodingTime + averageAudioDecodingTime + averageBufferTime + averageDrawingTime);
			document.getElementById('bench-demux').textContent = round1_0(averageDemuxingTime);
			document.getElementById('bench-video').textContent = round1_0(averageVideoDecodingTime);
			document.getElementById('bench-audio').textContent = round1_0(averageAudioDecodingTime);
			document.getElementById('bench-buffer').textContent = round1_0(averageBufferTime);
			document.getElementById('bench-draw').textContent = round1_0(averageDrawingTime);
			
			document.getElementById('video-jitter').textContent = round2(info.jitter);
			document.getElementById('audio-drops').textContent = info.droppedAudio;
			
			
			// keep it a rolling average
			player.resetPlaybackStats();
		}
	}
	
	function updateProgress() {
		if (player) {
			var total = player.duration,
				processed = player.currentTime,
				buffered = 0;
			if (player.buffered.length) {
				buffered = player.buffered.end(0);
			}

			function percent(val) {
				var ratio = val / total,
					percentage = ratio * 100.0;
				return percentage + '%';
			}
		
			document.getElementById('progress-total').title = total;
			document.getElementById('progress-buffered').style.width = percent(buffered);
			document.getElementById('progress-processed').style.width = percent(processed);
		}
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
	 * @param function({duration}, [{format, title, width, height, url}]) callback
	 */
	function findSourcesForMedia(media, callback) {
		commonsApi({
			action: 'query',
			prop: 'imageinfo|transcodestatus',
			titles: media,
			iiprop: 'url|size|mediatype|metadata',
			iiurlwidth: 1280,
			iiurlheight: 720
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
			
			function findMetadata(name) {
				var meta = imageinfo.metadata;
				for (var i = 0; i < meta.length; i++) {
					var pair = meta[i];
					if (pair.name === name) {
						return pair.value;
					}
				}
				return undefined;
			}
			var mediaInfo = {
				mediatype: imageinfo.mediatype,
				duration: findMetadata('length') || findMetadata('playtime_seconds'),
				thumburl: imageinfo.thumburl,
				thumbwidth: imageinfo.thumbwidth,
				thumbheight: imageinfo.thumbheight
			};
			
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
				key: 'original',
				format: format,
				width: imageinfo.width,
				height: imageinfo.height,
				url: imageinfo.url,
				size: imageinfo.size,
				bitrate: imageinfo.size * 8 / mediaInfo.duration
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
								format = matches[2],
								bitrate = parseFloat(transcode.final_bitrate);
							if (bitrate == 0) {
								// incomplete
								continue;
							}
							sources.push({
								key: key,
								format: format,
								width: Math.round(imageinfo.width * height / imageinfo.height),
								height: height,
								url: transcodeUrl(imageinfo.url, height, format),
								size: Math.round(bitrate * mediaInfo.duration / 8),
								bitrate: bitrate
							});
						} else {
							throw new Error("unexpected transcode key name: " + key);
						}
					}
				}
			}
			
			callback(mediaInfo, sources);
		});
	}

	function fetchMediaList(callback) {
		function pad00(n) {
			if (n < 10) {
				return '0' + n;
			} else {
				return '' + n;
			}
		}
		
		var today = new Date(),
			year = 2014,
			month = 06,
			day = 29; // where we left off in motd.js
		
		var input = '';
		while (true) {
			if ((year > today.getUTCFullYear()) ||
			    (year == today.getUTCFullYear() && month > (today.getUTCMonth() + 1)) ||
			    (year == today.getUTCFullYear() && month == (today.getUTCMonth() + 1) && day > today.getUTCDate())) {
				break;
			}
			var ymd = year +
					'-' +
					pad00(month) +
					'-' +
					pad00(day);
			var line = ymd + '|{{Motd/' + ymd + '}}\n';
			input += line;

			day++;
			if (day > 31) {
				day = 1;
				month++;
				if (month > 12) {
					month = 1;
					year++;
				}
			}
		}
		
		commonsApi({
			action: 'expandtemplates',
			text: input
		}, function(data, err) {
			var output = data.expandtemplates['*'],
				lines = output.split('\n');
			lines.forEach(function(line) {
				var bits = line.split('|'),
					date = bits[0],
					filename = bits[1];
				if (filename && !filename.match(/\.gif$/i)) {
					//console.log(filename);
					motd[date] = filename;
				} else {
					//console.log('motd update skipping ' + filename);
				}
			});
			callback();
		});
	}

	var container = document.getElementById('player'),
		controls = document.getElementById('controls'),
		videoChooser = document.getElementById('video-chooser'),
		selectedTitle = null,
		selectedUrl = null,
		skipAudio = false,
		playerBackend = 'js';
	
	var mediaList = document.getElementById('media-list'),
		filter = document.getElementById('filter');

	function getDefault() {
		if (document.location.hash.length > 1) {
			var title;
			playerBackend = 'js';
			document.location.hash.slice(1).split('&').forEach(function(pair) {
				var parts = pair.split('='),
					name = decodeURIComponent(parts[0]),
					value = decodeURIComponent(parts[1]);
				skipAudio = false;
				if (name === 'file') {
					title = value;
				} else if (name === 'search') {
					filter.value = value;
				} else if (name === 'mute') {
					document.getElementById('mute').checked = (value == '1');
				} else if (name === 'size') {
					var selector = document.getElementById('video-preferred-size');
					selector.value = value;
					preferredKey = value;
				} else if (name == 'audio') {
					if (value == '0') {
						skipAudio = true;
					}
				} else if (name == 'player') {
					document.getElementById('player-backend').value = value;
					playerBackend = value;
				}
			});
			if (title) {
				return 'File:' + title;
			}
		}
		return 'File:Jarry_-_Métro_de_Montréal_(640×360).ogv';
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
	filter.addEventListener('keypress', function(event) {
		if (event.keyCode == 10 || event.keyCode == 13) {
			showChooser();
		}
	});
	filter.addEventListener('delete', showChooser);
	filter.addEventListener('cut', showChooser);
	filter.addEventListener('paste', showChooser);
	filter.addEventListener('focus', showChooser);
	window.addEventListener('hashchange', function() {
		// Warning: sometimes this triggers when we change it programatically
		// it seems to be normalizing our unicode or something. Fun!
		var oldTitle = selectedTitle,
			oldFilter = filter.value,
			oldSize = preferredKey,
			oldPlayer = playerBackend;
		selectedTitle = getDefault();
		if (oldTitle != selectedTitle || oldSize != preferredKey || oldPlayer != playerBackend) {
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
			stopVideo();
			selectedTitle = title;
			setHash();
			dismissChooser();
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
		
		if (playerBackend != 'js') {
			hash += '&player=' + encodeURIComponent(playerBackend);
		}
		
		var sizeKey = document.getElementById('video-preferred-size').value;
		hash += '&size=' + sizeKey;
		
		document.location.hash = hash;
	}
	
	var preferredKey = '360p.ogv';
	if (navigator.userAgent.match(/Mobile/)) {
		preferredKey = '160p.ogv';
	}
	var selector = document.getElementById('video-preferred-size');
	selector.value = preferredKey;
	selector.addEventListener('change', function() {
		preferredKey = selector.value;
		console.log('changed to ' + preferredKey);
		setHash();
		showVideo();
	});
	
	document.querySelector('#player-backend').addEventListener('change', function() {
		stopVideo();
		playerBackend = this.value;
		setHash();
		showVideo();
	});


	function resizeVideo() {
		var container = document.getElementById('player'),
			computedStyle = window.getComputedStyle(container),
			containerWidth = parseInt(computedStyle.getPropertyValue('width')),
			containerHeight = parseInt(computedStyle.getPropertyValue('height'));

		var videoWidth = player.videoWidth,
			videoHeight = player.videoHeight;
		if (videoWidth == 0 || videoHeight == 0) {
			// hack hack
			// we already set these at poster setup time
			// warning these get corrupted over time if we resize the poster a lot
			videoWidth = player.width;
			videoHeight = player.height;
		}
		var width = containerWidth,
			height = videoHeight * width / videoWidth,
			top = 0;

		if (height > containerHeight) {
			height = containerHeight;
			width = videoWidth * height / videoHeight;
		} else {
			top = Math.round((containerHeight - height) / 2);
		}
		
		player.width = width;
		player.height = height;
		player.style.marginTop = top + 'px';
	}
	window.addEventListener('resize', function() {
		if (player) {
			resizeVideo();
		}
	});
	
	function showVideo() {
		window.scrollTo(0, 0);
		stopVideo();

		var prettyName = selectedTitle.replace(/_/g, ' ').replace(/^File:/, '');
		document.title = prettyName + ' - ogv.js demo/test';
		
		var pagelink = document.getElementById('pagelink');
		pagelink.textContent = prettyName;
		pagelink.href = 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(selectedTitle);
		findSourcesForMedia(selectedTitle, function(mediaInfo, sources) {
			console.log('type of file: ' + mediaInfo.mediatype);
			console.log('duration of file: ' + mediaInfo.duration);
			
			// Find the transcoded or original ogv stream for now
			
			// temporarily disable the smallest transcodes, except on mobiles/iOS
			var minHeight;
			var selected = null,
				original = null,
				oga = null;
			sources.forEach(function(source) {
				if (source.key == 'original' && source.format == 'ogv') {
					original = source;
				}
				if (source.key == preferredKey) {
					selected = source;
				}
				if (source.format == 'oga') {
					oga = source;
				}
			});
			if (selected == null) {
				console.log("Try original file");
				selected = original;
			}
			if (selected == null) {
				console.log("Try audio-only .oga transcode");
				selected = oga;
			}
			if (selected == null) {
				throw new Error("No ogv or oga source found.");
			}
			
			selectedUrl = selected.url;
			console.log("Going to try streaming data from " + selectedUrl);
			
			// Currently the player can't determine the file duration
			// as there's no way to seek to the end etc.
			durationHint = mediaInfo.duration;

			if (playerBackend == 'js') {
				player = new OgvJsPlayer({
					webGL: true, // auto
					base: 'lib'
				});
				player.durationHint = durationHint;
			} else if (playerBackend == 'js-cpu') {
				player = new OgvJsPlayer({
					webGL: false, // force 2d canvas
					base: 'lib'
				});
				player.durationHint = durationHint;
			} else if (playerBackend == 'webgl') {
				player = new OgvJsPlayer({
					forceWebGL: true,
					base: 'lib'
				});
				player.durationHint = durationHint;
			} else if (playerBackend == 'flash') {
				player = new OgvSwfPlayer({
					base: 'lib'
				});
				player.durationHint = durationHint;
			} else if (playerBackend == 'cortado') {
				player = new CortadoPlayer();
				player.durationHint = durationHint;
				player.videoWidthHint = selected.width;
				player.videoHeightHint = selected.height;
			} else if (playerBackend == 'native') {
				player = document.createElement('video');
			} else {
				throw new Error('unknown player backend');
			}
			player.width = selected.width;
			player.height = selected.height;


			document.getElementById('video-fps').textContent = '';
			document.getElementById('video-pic-width').textContent = '';
			document.getElementById('video-pic-height').textContent = '';
			document.getElementById('video-jitter').textContent = '';
			document.getElementById('audio-channels').textContent = '';
			document.getElementById('audio-rate').textContent = '';
			document.getElementById('audio-drops').textContent = '';
			player.onloadedmetadata = function() {
				// Standard metadata ain't much.
				document.getElementById('video-pic-width').textContent = player.videoWidth;
				document.getElementById('video-pic-height').textContent = player.videoHeight;

				// And grab our custom metadata...				
				var fps;
				if (typeof (player.ogvjsVideoFrameRate) === 'number') {
					benchmarkTargetFps = player.ogvjsVideoFrameRate;
					fps = round2(player.ogvjsVideoFrameRate);
				} else {
					// Native video element doesn't seem to expose frame rate?!
					benchmarkTargetFps = 60;
					fps = '?';
				}
				document.getElementById('video-fps').textContent = fps;

				if (typeof player.ogvjsAudioChannels === 'number') {
					document.getElementById('audio-channels').textContent = player.ogvjsAudioChannels;
					document.getElementById('audio-rate').textContent = player.ogvjsAudioSampleRate;
				}
			};

			clearBenchmark();
			// There is a 'timeupdate' event on HTMLMediaElement, but it only
			// seems to fire every quarter second. No per-frame callback for
			// native video, sorry!
			player.onframecallback = function(info) {
				recordBenchmarkPoint(info.cpuTime, info.clockTime);
			};

			player.src = selectedUrl;
			player.muted = controls.querySelector('#mute').checked;
			
			var container = document.getElementById('player');
			container.insertBefore(player, container.firstChild);

			if (selected.height > 0) {
				player.width = selected.width;
				player.height = selected.height;
			} else {
				player.width = 256; // hack for audio
				player.height = 256;
			}
			resizeVideo();
			//drawPlayButton();

			player.removeEventListener('click', togglePause);
			player.addEventListener('click', playVideo);
			
			document.querySelector('.play').style.display = 'inline';
			document.querySelector('.pause').style.display = 'none';
			player.onplay = function() {
				document.querySelector('.play').style.display = 'none';
				document.querySelector('.pause').style.display = 'inline';
			};
			player.onpause = function() {
				document.querySelector('.play').style.display = 'inline';
				document.querySelector('.pause').style.display = 'none';
			};
			player.onended = function() {
				document.querySelector('.play').style.display = 'inline';
				document.querySelector('.pause').style.display = 'none';
			};

			player.poster = mediaInfo.thumburl;
			player.load();

			updateProgress();
			
			//nativeVideo.width = selected.width;
			//nativeVideo.height = selected.height;
		});
	}
	
	function drawPlayButton() {
		var midX = canvas.width / 2,
			midY = canvas.height / 2,
			side = canvas.height / 4;
		
		function triangle() {
			ctx.beginPath();
			ctx.moveTo(midX - side / 2, midY - side / 2);
			ctx.lineTo(midX + side / 2, midY);
			ctx.lineTo(midX - side / 2, midY + side / 2);
			ctx.lineTo(midX - side / 2, midY - side / 2);
		}
		
		ctx.save();
		triangle();
		ctx.fillStyle = "white";
		ctx.fill();
		ctx.restore();
		
		ctx.save();
		triangle();
		ctx.strokeStyle = "2px black";
		ctx.stroke();
		ctx.restore();
	}
	
	var selectedTitle = getDefault();
	//showChooser();
	showVideo();
	fetchMediaList(function() {
		console.log('media list updated');
	});

	function stopVideo() {
		if (player) {
			player.parentElement.removeChild(player);
			player = null;
		}
	}
	
	function togglePause() {
		if (player.paused) {
			player.play();
		} else {
			player.pause();
		}
	}
	
	function playVideo() {
		player.removeEventListener('click', playVideo);
		player.addEventListener('click', togglePause);

		var status = document.getElementById('status-view');
		status.className = 'status-invisible';
		status.textContent = '';

		player.load();
		player.play();
	}


	function showStatus(str) {		
		status.className = 'status-visible';
		status.textContent = str;
	}

	function errorHandler(event) {
		var str;
		if ('message' in event) {
			str = event.message;
		} else {
			str = "unknown script error";
		}
		showStatus(str);
		console.log(event);
	}
	//window.addEventListener('error', errorHandler);

	controls.querySelector('.play').addEventListener('click', function() {
		if (player) {
			player.play();
		}
	});
	controls.querySelector('.pause').addEventListener('click', function() {
		if (player) {
			player.pause();
		}
	});
	controls.querySelector('.stop').addEventListener('click', function() {
		if (player) {
			showVideo();
		}
	});
	controls.querySelector('#mute').addEventListener('click', function() {
		if (player) {
			player.muted = this.checked;
		}
		setHash();
	});
	controls.querySelector('.fullscreen').addEventListener('click', function() {
		var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
		if (fullscreenElement == container) {
			var cancelFullscreen = (document.cancelFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen || document.msExitFullscreen).bind(document);
			cancelFullscreen();
		} else {
			var requestFullscreen = (container.requestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen || container.msRequestFullscreen).bind(container);
			requestFullscreen();
		}
	});
	document.addEventListener('fullscreenchange', resizeVideo);
	document.addEventListener('mozfullscreenchange', resizeVideo);
	document.addEventListener('webkitfullscreenchange', resizeVideo);
	document.addEventListener('MSFullscreenChange', resizeVideo);
	
	var topPanel = document.getElementById('top-panel'),
		controlPanel = document.getElementById('control-panel');
	var playerTimeout;
	function hideControlPanel() {
		if (controlPanel.style.opacity == 1.0) {
			controlPanel.style.opacity = 0.0;
			topPanel.style.opacity = 0.0;
		}
		if (playerTimeout) {
			clearTimeout(playerTimeout);
			playerTimeout = null;
		}
	}
	function delayHideControlPanel() {
		if (playerTimeout) {
			clearTimeout(playerTimeout);
		}
		playerTimeout = setTimeout(function() {
			playerTimeout = null;
			controlPanel.style.opacity = 0.0;
			topPanel.style.opacity = 0.0;
		}, 5000);
	}
	function showControlPanel() {
		if (controlPanel.style.opacity == 0.0) {
			controlPanel.style.opacity = 1.0;
			topPanel.style.opacity = 1.0;
		}
	}
	container.addEventListener('mousemove', function() {
		showControlPanel();
		delayHideControlPanel();
	});
	delayHideControlPanel();

	//nativePlayer.querySelector('.play').addEventListener('click', function() {
	//	nativeVideo.play();
	//}
	
	window.setInterval(function() {
		if (player && benchmarkData.length > 0) {
			showBenchmark();
			showAverageRate();
		}
		updateProgress();
	}, 1000);

})();
