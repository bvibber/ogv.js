(function() {

	var getTimestamp;
	if (window.performance === undefined || window.performance.now === undefined) {
		console.log("window.performance.now is not available; using Date.now() for benchmarking");
		getTimestamp = Date.now;
	} else {
		console.log("window.performance.now is available; using window.performance.now() for benchmarking");
		getTimestamp = window.performance.now.bind(window.performance);
	}

	var devicePixelRatio = window.devicePixelRatio || 1;

	var player;
	var averagePlayTime = 0, // ms
		averageDemuxingTime = 0, // ms
		averageVideoDecodingTime = 0, // ms
		averageAudioDecodingTime = 0, // ms
		averageBufferTime = 0, // ms
		averageDrawingTime = 0, // ms
		averageProxyTime = 0; // ms

	var benchmarkData = [],
		benchmarkClockData = [],
		benchmarkVideoData = [],
		benchmarkAudioData = [],
		benchmarkLateData = [],
		benchmarkDirty = false,
		benchmarkTargetFps = -1;
	function clearBenchmark() {
		benchmarkData = [];
		benchmarkClockData = [];
		benchmarkVideoData = [];
		benchmarkAudioData = [];
		benchmarkDirty = true;
	}
	function recordBenchmarkPoint(info) {
		benchmarkData.push(info.cpuTime);
		benchmarkVideoData.push(info.videoTime);
		benchmarkAudioData.push(info.audioTime);
		benchmarkClockData.push(info.clockTime);
		benchmarkLateData.push(info.late);

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
			cpuData = benchmarkData.slice(-chunkSize),
			videoData = benchmarkVideoData.slice(-chunkSize),
			audioData = benchmarkAudioData.slice(-chunkSize),
			lateData = benchmarkLateData.slice(-chunkSize);

		// Draw!

		ctx.clearRect(0, 0, width, height);

		function x(i) {
			return Math.round(i * (width - 1) / maxItems);
		}
		function y(ms) {
			return Math.round((height - 1) - ms * (height - 1) / maxTime);
		}

		var barX = [],
			barWidth = [];
		for (i = 0; i < maxItems; i++) {
			barX[i] = x(i);
			barWidth[i] = Math.max(x(i + 1) - barX[i], 1);
		}

		// Time bar graph
		ctx.globalAlpha = 0.33;

		// Wall clock time
		ctx.fillStyle = 'darkviolet';
		for (i = 0; i < maxItems; i++) {
			if (lateData[i]) {
				var py = y(clockData[i]),
					pheight = y(fpsTarget) - py;
				ctx.fillRect(barX[i], py, barWidth[i], pheight);
			}
		}
		ctx.fillStyle = 'blue';
		for (i = 0; i < maxItems; i++) {
			if (!lateData[i]) {
				var py = y(clockData[i]),
					pheight = y(fpsTarget) - py;
				ctx.fillRect(barX[i], py, barWidth[i], pheight);
			}
		}

		// Video decode thread
		ctx.fillStyle = 'darkcyan';
		for (i = 0; i < maxItems; i++) {
			var py = y(videoData[i]);
			ctx.fillRect(barX[i], py, barWidth[i], height - py);
		}

		// Audio decode thread
		ctx.fillStyle = 'green';
		for (i = 0; i < maxItems; i++) {
			var py = y(audioData[i]);
			ctx.fillRect(barX[i], py, barWidth[i], height - py);
		}

		// Main thread CPU time
		ctx.fillStyle = 'black';
		for (i = 0; i < maxItems; i++) {
			var py = y(cpuData[i]);
			ctx.fillRect(barX[i], py, barWidth[i], height - py);
		}

		ctx.globalAlpha = 1;

		if (benchmarkTargetFps) {
			ctx.beginPath();
			ctx.strokeStyle = 'red';
			ctx.fillStyle = 'none';
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
			averagePlayTime = info.playTime / info.framesProcessed;
			averageDemuxingTime = info.demuxingTime / info.framesProcessed;
			averageVideoDecodingTime = info.videoDecodingTime / info.framesProcessed;
			averageAudioDecodingTime = info.audioDecodingTime / info.framesProcessed;
			averageBufferTime = info.bufferTime / info.framesProcessed;
			averageDrawingTime = info.drawingTime / info.framesProcessed;
			averageProxyTime = info.proxyTime / info.framesProcessed;

			var targetPerFrameTime = info.targetPerFrameTime;
			benchmarkTargetFps = 1000 / targetPerFrameTime;
			document.getElementById('bench-target').textContent = round1_0(targetPerFrameTime);
			document.getElementById('bench-clock').textContent = round1_0(averagePlayTime);
			document.getElementById('bench-total').textContent = round1_0(averageDemuxingTime + averageBufferTime + averageDrawingTime + averageProxyTime);
			document.getElementById('bench-demux').textContent = round1_0(averageDemuxingTime);
			document.getElementById('bench-video').textContent = round1_0(averageVideoDecodingTime);
			document.getElementById('bench-audio').textContent = round1_0(averageAudioDecodingTime);
			document.getElementById('bench-buffer').textContent = round1_0(averageBufferTime);
			document.getElementById('bench-draw').textContent = round1_0(averageDrawingTime);
			document.getElementById('bench-proxy').textContent = round1_0(averageProxyTime);

			document.getElementById('video-fps').textContent = round2(player.ogvjsVideoFrameRate);
			document.getElementById('video-jitter').textContent = round2(info.jitter);
			document.getElementById('video-late').textContent = info.lateFrames;
			document.getElementById('audio-drops').textContent = info.droppedAudio;
			document.getElementById('audio-delayed').textContent = round1_0(info.delayedAudio);

			// keep it a rolling average
			player.resetPlaybackStats();
		}
	}

	function clamp(val) {
		if (val < 0) {
			return 0;
		} else if (val > 1) {
			return 1;
		} else {
			return val;
		}
	}
	var thumbSeeking = false,
		initialThumbX = 0,
		seekTarget = 0;
	function updateProgress() {
		if (player) {
			var total = player.duration,
				processed = player.currentTime,
				thumb = (thumbSeeking ? seekTarget : processed),
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
			document.getElementById('progress-thumb').style.left = percent(thumb);

			function simtrunc(val) {
				if (val >= 0) {
					return Math.floor(val);
				} else {
					return Math.ceil(val);
				}
			}
			var trunc = Math.trunc || simtrunc;

			function formatTime(time) {
				var rtime = Math.round(time),
					minutes = trunc(rtime / 60),
					seconds = Math.abs(rtime % 60),
					padding = (seconds < 10) ? '0' : '';
				return minutes + ':' + padding + seconds;
			}

			controls.querySelector('.time-elapsed').textContent = formatTime(thumb);
			if (player.duration < Infinity) {
				controls.querySelector('.time-remaining').textContent = formatTime(thumb - total);
			} else {
				controls.querySelector('.time-remaining').textContent = '';
			}
		}
	}

	/**
	 * dictionary -> URL query string params
	 */
	function arrayToCgi(params) {
		var components = [];
		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				var pair = encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
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
		var baseUrl = 'https://commons.wikimedia.org/w/api.php';
		var url = baseUrl + '?&origin=*'; // anonymous CORS
		var payload = arrayToCgi(params) + '&format=json';

		var xhr = new XMLHttpRequest();
		xhr.open('POST', url);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status >= 400) {
					throw new Error('Unexpected error ' + xhr.status + 'from Commons API');
				}
				var data = JSON.parse(xhr.responseText);
				callback(data);
			}
		};
		xhr.send(payload);
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
			filename = matches[3],
			sourceMode = document.querySelector('#media-source').value;
		if (sourceMode == 'shortlist') {
			baseUrl = 'https://media-streaming.wmflabs.org';
		}
		if (sourceMode == 'shortlist-cbr') {
			baseUrl = 'https://media-streaming.wmflabs.org/cbr-soft';
		}
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
			var sourceMode = document.querySelector('#media-source').value;
			if (sourceMode == 'shortlist' || sourceMode == 'shortlist-cbr') {
				var sizes = [160, 240, 360, 480, 720, 1080, 1440, 2160],
					widths = [284, 426, 640, 854, 1280, 1920, 2560, 3840],
					formats = ['ogv', 'webm'];
				sizes.forEach(function(size, i) {
					formats.forEach(function(format) {
						// fixme: tweak if necessary
						var width = widths[i],
							aspect = imageinfo.width / imageinfo.height,
							height = Math.round(width / aspect);
						if (width <= imageinfo.width) {
							sources.push({
								key: size + 'p.' + format,
								format: format,
								width: width,
								height: height,
								url: transcodeUrl(imageinfo.url, size, format),
							});
						}
					});
				});
			} else {
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
								console.log("unexpected transcode key name: " + key);
							}
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
			year = 2016,
			month = 09,
			day = 20; // where we left off in motd.js, @fixme use live info

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
		spinner = document.getElementById('spinner-panel'),
		videoChooser = document.getElementById('video-chooser'),
		selectedTitle = null,
		selectedUrl = null,
		skipAudio = false,
		playerBackend = 'js',
		muted = false,
		startTime = 0,
		autoplay = false;

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
					muted = (value == '1');
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
				} else if (name == 'source') {
					document.querySelector('#media-source').value = value;
				}
			});
			if (title) {
				return 'File:' + title;
			}
		}

		// classics! soothing noises, no lipsync to worry about
		//return 'File:Jarry_-_Métro_de_Montréal_(640×360).ogv';

		// clean CG imagery, 1080p source, sound effects but no speech
		//return 'File:Caminandes_-_Gran_Dillama_-_Blender_Foundation\'s_new_Open_Movie.webm';

		// video mostly talking heads, 1080p source, speech needs lipsync
		//return 'File:How_Open_Access_Empowered_a_16-Year-Old_to_Make_Cancer_Breakthrough.ogv';

		// video mostly talking heads, 720p source, speech needs lipsync
		//return 'File:¿Qué es Wikipedia?.ogv';

		// long live-action, mix of various types. 720p+ source, speech needs lipsync
		//return 'File:Knowledge_for_Everyone_(no_subtitles).webm';

		// classics! 720p source, mix of gfx and talking heads. speech needs libsync
		return 'File:Curiosity\'s_Seven_Minutes_of_Terror.ogv';
	}

	var chooserState = 0,
		typingSearchTimeout = null,
		lastSearchValue = null;
	function dismissChooser() {
		document.getElementById('media-chooser-stub').className = '';
		document.getElementById('media-chooser').className = '';
	}
	document.getElementById('media-chooser-stub').addEventListener('click', function() {
		dismissChooser();
	});
	document.querySelector('#media-source').addEventListener('change', function() {
		lastSearchValue = null;
		dismissChooser();
		stopVideo();
		setHash();
		showVideo();
		showChooser();
	});
	function showChooser() {
		var sourceMode = document.querySelector('#media-source').value;

		if (typingSearchTimeout) {
			clearTimeout(typingSearchTimeout);
			typingSearchTimeout = null;
		}
		setHash();

		document.getElementById('media-chooser-stub').className = 'active';
		document.getElementById('media-chooser').className = 'active';

		if (lastSearchValue == filter.value) {
			return;
		}
		lastSearchValue = filter.value;
		var filterString = filter.value.toLowerCase().replace(/^\s+/, '').replace(/\s+$/, '');

		function passFilter(title) {
			return filterString == '' || title.toLowerCase().indexOf(filterString) != -1;
		}

		var selection = [],
			frameRates = {},
			descriptions = {};
		
		function processList(shortlist) {
			shortlist.forEach(function(item) {
				var title = item[0],
					format = item[1],
					desc = item[2];
				if (passFilter(title) || passFilter(format) || passFilter(desc)) {
					selection.push(title);
					var bits = format.split(/p/);
					frameRates[title] = parseFloat(bits[1]);
					descriptions[title] = desc;
				}
			});
		}
		if (sourceMode == 'motd') {
			var max = 40, list = [];
			for (var day in motd) {
				if (motd.hasOwnProperty(day)) {
					var title = motd[day];
					if (passFilter(title)) {
						list.push('File:' + motd[day]);
					}
				}
			}
			selection = list.reverse().slice(0, max);
		} else if (sourceMode == 'blender') {
			processList([
				[
					"File:Caminandes- Llama Drama - Short Movie.ogv",
					'1080p24',
					'3d animation'
				],
				[
					"File:Caminandes - Gran Dillama - Blender Foundation's new Open Movie.webm",
					'1080p24',
					'3d animated'
				],
				[
					"File:Glass Half - 3D animation with OpenGL cartoon rendering.webm",
					'2160p24',
					'2d animation'
				],
				[
					"File:Tears of Steel in 4k - Official Blender Foundation release.webm",
					'2160p24',
					'live action + CG effects'
				],
				[
					"File:Cosmos Laundromat - First Cycle - Official Blender Foundation release.webm",
					'1152p24',
					'3d animation'
				],
				[
					"File:Sintel movie 4K.webm",
					'2304p24',
					'3d animation (has 1000fps bug)'
				],
				[
					"File:Big Buck Bunny 4K.webm",
					'2250p60',
					'3d animation (has 1000fps bug)'
				],
				[
					"File:Elephants Dream (2006) 1080p24.webm",
					'1080p24',
					'3d animation'
				]
			]);
		} else if (sourceMode == 'highfps') {
			processList([
				[
					"File:Spectator Mode for Job Simulator - a new way to display social VR footage.webm",
					'1080p60',
					'VR game footage'
				],
				[
					"File:ManifoldGarden BRoll01 E3 V01.webm",
					'1080p60',
					'game footage'
				],
				[
					"File:Big Buck Bunny 4K.webm",
					'2250p60',
					'animation (has 1000fps bug)'
				],
				[
					"File:Stugl,aerial video.webm",
					'1080p60',
					'aerial drone footage'
				],
				[
					"File:A Moment with Astronaut Kjell Lindgren.webm",
					'1080p59.94',
					'live action'
				],
				[
					"File:Red-tailed Hawk Eating a Rodent 1080p 60fps.ogv",
					'1080p59.94',
					'live action'
				]
			]);
		} else if (sourceMode == 'shortlist' || sourceMode == 'shortlist-cbr') {
			var shortlist = [
				// Blender movies
				[
					"File:Caminandes - Gran Dillama - Blender Foundation's new Open Movie.webm",
					'1080p24',
					'3d animated'
				],
				[
					"File:Glass Half - 3D animation with OpenGL cartoon rendering.webm",
					'2160p24',
					'cartoon; some motion spikes'
				],
				[
					"File:Tears of Steel in 4k - Official Blender Foundation release.webm",
					'2160p24',
					'sci-fi; mix of scene types'
				],

				// Space stuff
				[
					"File:Curiosity's Seven Minutes of Terror.ogv",
					'720p23.98',
					'live-action with CG elements'
				],
				[
					"File:RED 4K Video of Colorful Liquid in Space.webm",
					'2160p23.98',
					'UHD, modest motion'
				],
				[
					"File:Ultra High Definition Video from the International Space Station (Reel 1).webm",
					'2160p23.98',
					'UHD, mix of low and high motion'
				],
				[
					"File:Here's to Engineering.webm",
					'2160p23.98',
					'UHD, low motion'
				],

				// Wikipedia stuff
				[
					"File:Art and Feminism Wikipedia Edit-a-thon, February 1, 2014.webm",
					'1080p23.98',
					'low motion with some spikes'
				],
				[
					"File:How Open Access Empowered a 16-Year-Old to Make Cancer Breakthrough.ogv",
					'1080p23.98',
					'talking heads; modest motion'
				],
				[
					"File:Knowledge for Everyone (short cut).webm",
					'1080p23.98',
					'mix of scenes'
				],
				[
					"File:Share-a-Fact on the Official Wikipedia Android app.webm",
					'1080p29.97',
					'short animation, some motion spikes'
				],
				[
					"File:Sneak Preview - Wikipedia VisualEditor.webm",
					'1080p23.98',
					'modest motion with spikes'
				],
				[
					"File:The Impact Of Wikipedia.webm",
					'1080p23.98',
					'low motion'
				],
				[
					"File:WikiArabia tech meetup in Ramallah 2016.webm",
					'1080p24',
					'modest motion'
				],
				[
					"File:Wikipedia Edit 2015.webm",
					'1080p24',
					'animated, many dupe frames'
				],
				[
					"File:Wiki Makes Video Intro 4 26.webm",
					'720p59.94',
					'high fps, mix of scenes'
				],
				[
					"File:This is the Wikimedia Foundation.webm",
					'1080p23.98',
					'mix of scenes'
				],

				// Misc stuff
				[
					"File:Tawakkol Karman (English).ogv",
					'1080p50',
					'high fps, modest motion'
				],
				[
					"File:Eisbach surfen v1.ogv",
					'1080p30',
					'high motion'
				],
				[
					"File:FEZ trial gameplay HD.webm",
					'720p30',
					'animation'
				],
				[
					"File:Furcifer pardalis moving eyes.ogv",
					'1080p24',
					'low motion'
				],
				[
					"File:Red-tailed Hawk Eating a Rodent 1080p 60fps.ogv",
					'1080p59.94',
					'high fps, moderate motion'
				],
				[
					"File:Snowdonia by drone.webm",
					'1080p30',
					'mix of high and low motion scenes'
				],
				[
					"File:Stugl,aerial video.webm",
					'1080p60',
					'high fps, high motion'
				]
			];
			processList(shortlist);
		} else {
			throw new Error('unexpected sourceMode');
		}

		mediaList.innerHTML = '';

		if (selection.length == 0) {
			mediaList.appendChild(document.createTextNode('No matches'));
			return;
		}

		chooserState++;
		var state = chooserState;
		commonsApi({
			action: 'query',
			prop: 'imageinfo',
			iiprop: 'url|size',
			iiurlwidth: 128 * devicePixelRatio,
			iiurlheight: 128 * devicePixelRatio,
			titles: selection.join('|')
		}, function(data) {
			if (state == chooserState) {
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
						var fmt = imageinfo.width + 'x' + imageinfo.height;
						if (fmt == '0x0') {
							fmt = 'audio';
						}
						if (frameRates[title]) {
							fmt += ' ';
							fmt += frameRates[title];
							fmt += 'fps';
						}
						addMediaSelector(title, imageinfo, fmt, descriptions[title]);
					}
				});
			}
		});
	}
	filter.addEventListener('change', showChooser);
	document.querySelector('#searchform').addEventListener('submit', function(event) {
		event.preventDefault();
		showChooser();
		filter.blur();
	});
	filter.addEventListener('delete', showChooser);
	filter.addEventListener('cut', showChooser);
	filter.addEventListener('paste', showChooser);
	filter.addEventListener('focus', showChooser);
	filter.addEventListener('keydown', function() {
		if (typingSearchTimeout) {
			clearTimeout(typingSearchTimeout);
		}
		typingSearchTimeout = setTimeout(showChooser, 250);
	});

	window.addEventListener('hashchange', function() {
		// Warning: sometimes this triggers when we change it programatically
		// it seems to be normalizing our unicode or something. Fun!
		var oldTitle = selectedTitle,
			oldFilter = filter.value,
			oldSize = preferredKey,
			oldPlayer = playerBackend;
		selectedTitle = getDefault();
		if (oldTitle != selectedTitle || oldSize != preferredKey || oldPlayer != playerBackend) {
			stopVideo();
			startTime = 0;
			autoplay = false;
			showVideo();
		}
		if (oldFilter != filter.value && document.getElementById('media-chooser').className == 'active') {
			showChooser();
		}
	});

	function addMediaSelector(title, imageinfo, format, desc) {
		var item = document.createElement('div'),
			img = document.createElement('img');

		item.className = 'media-item';

		img.className = 'thumb';
		img.src = imageinfo.thumburl;
		img.title = "Play video"
		img.width = imageinfo.thumbwidth / devicePixelRatio;
		img.height = imageinfo.thumbheight / devicePixelRatio;

		var titleDiv = document.createElement('div');
		titleDiv.className = 'title';
		titleDiv.appendChild(document.createTextNode(' ' + title.replace('File:', '').replace(/_/g, ' ')));

		var descDiv = document.createElement('div');
		descDiv.className = 'desc';
		if (format) {
			var formatSpan = document.createElement('span');
			formatSpan.className = 'format';
			formatSpan.appendChild(document.createTextNode(format));
			descDiv.appendChild(formatSpan);
		}
		if (desc) {
			var descSpan = document.createElement('span');
			descSpan.appendChild(document.createTextNode(desc));
			descDiv.appendChild(descSpan);
		}

		item.appendChild(img);
		item.appendChild(titleDiv);
		item.appendChild(descDiv);
		item.addEventListener('click', function() {
			stopVideo();
			startTime = 0;
			autoplay = false;
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

		if (muted) {
			hash += '&mute=1';
		}

		if (playerBackend != 'js') {
			hash += '&player=' + encodeURIComponent(playerBackend);
		}

		var sizeKey = document.getElementById('video-preferred-size').value;
		hash += '&size=' + sizeKey;

		var mode = document.getElementById('media-source').value;
		if (mode == 'motd') {
			// nothin
		} else {
			hash += '&source=' + mode;
		}

		document.location.hash = hash;
	}

	var preferredKey = '360p.ogv';
	if (OGVCompat.isSlow()) {
		preferredKey = '160p.ogv';
	}
	var selector = document.getElementById('video-preferred-size');
	selector.value = preferredKey;
	selector.addEventListener('change', function() {
		stopVideo();
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

			var selector = document.getElementById('video-preferred-size');
			var options = selector.querySelectorAll('option'),
				optionsMap = {};
			for (var i = 0; i < options.length; i++) {
				optionsMap[options[i].value] = options[i];
				options[i].disabled = true;
			}

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
				if (optionsMap[source.key]) {
					if (optionsMap.hasOwnProperty(source.key)) {
						optionsMap[source.key].disabled = false;
					}
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

			if (player) {
				// this should not happen
				stopVideo();
			}
			var maxmem = undefined;
			if (selected.height > 1080) {
				// hack
				maxmem = 1024 * 1024 * 128;
			}
			var debugFilter;
			//debugFilter = /setting a timer|ready to draw frame|decode frame|decoded frame|drew frame/;
			//debugFilter = /drew frame/;
			//debugFilter = /drew frame.*mux: [^0]/;
			//debugFilter = /drew frame.*mux: [^0]|ahead|dropped|delayed/;
			//debugFilter = /drew frame.*mux: [^0]|audio checkin/;
			//debugFilter = /drew frame|dropped|delayed/;
			//debugFilter = /demuxer|stream is at end/;
			//debugFilter = /waiting/;
			debugFilter = /late frame/;
			//debugFilter = /setting a timer/;
			//debugFilter = /ended|ending|end |demuxer/i;
			//debugFilter = /play loop.*(draw|frame)/;
			if (playerBackend == 'js') {
				player = new OGVPlayer({
					debug: !!debugFilter,
					debugFilter: debugFilter,
					memoryLimit: maxmem,
					enableWebM: true // experimental
				});
			} else if (playerBackend == 'js-cpu') {
				player = new OGVPlayer({
					debug: !!debugFilter,
					debugFilter: debugFilter,
					memoryLimit: maxmem,
					webGL: false, // force 2d canvas
					enableWebM: true // experimental
				});
			} else if (playerBackend == 'js-noworker') {
				player = new OGVPlayer({
					debug: !!debugFilter,
					debugFilter: debugFilter,
					memoryLimit: maxmem,
					worker: false, // experimental
					enableWebM: true // experimental
				});
			} else if (playerBackend == 'webgl') {
				player = new OGVPlayer({
					debug: !!debugFilter,
					debugFilter: debugFilter,
					memoryLimit: maxmem,
					forceWebGL: true,
					enableWebM: true // experimental
				});
			} else if (playerBackend == 'cortado') {
				player = new CortadoPlayer();
				player.durationHint = mediaInfo.duration;
				player.videoWidthHint = selected.width;
				player.videoHeightHint = selected.height;
				player.width = selected.width; // ?
				player.height = selected.height;
			} else if (playerBackend == 'native') {
				player = document.createElement('video');
			} else {
				throw new Error('unknown player backend');
			}


			document.getElementById('video-fps').textContent = '';
			document.getElementById('video-pic-width').textContent = '';
			document.getElementById('video-pic-height').textContent = '';
			document.getElementById('video-jitter').textContent = '';
			document.getElementById('audio-channels').textContent = '';
			document.getElementById('audio-rate').textContent = '';
			document.getElementById('audio-drops').textContent = '';

			spinner.classList.add('loading');
			player.addEventListener('loadedmetadata', function() {
				spinner.classList.remove('loading');
				updateProgress();

				// Standard metadata ain't much.
				document.getElementById('video-pic-width').textContent = player.videoWidth;
				document.getElementById('video-pic-height').textContent = player.videoHeight;

				// And grab our custom metadata...
				var fps;
				if (typeof (player.ogvjsVideoFrameRate) === 'number' && player.ogvjsVideoFrameRate > 0) {
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
			});

			spinner.classList.remove('seeking');
			player.addEventListener('seeking', function() {
				spinner.classList.add('seeking');
			});
			player.addEventListener('seeked', function() {
				spinner.classList.remove('seeking');
			});

			player.addEventListener('timeupdate', function() {
				updateProgress();
			});

			clearBenchmark();
			// There is a 'timeupdate' event on HTMLMediaElement, but it only
			// seems to fire every quarter second. No per-frame callback for
			// native video, sorry!
			player.addEventListener('framecallback', function(info) {
				recordBenchmarkPoint(info);
			});

			player.addEventListener('ended', function() {
				updateProgress();
				showControlPanel();
			});

			player.addEventListener('pause', function() {
				updateProgress();
				showControlPanel();
			});

			player.addEventListener('play', function() {
				delayHideControlPanel();
			});

			if (startTime == 0) {
				player.poster = mediaInfo.thumburl;
			}
			player.src = selectedUrl;
			player.muted = muted;
			player.addEventListener('loadedmetadata', function() {
				if (startTime) {
					player.currentTime = startTime;
					if (autoplay) {
						player.play();
					}
				}
			});

			var container = document.getElementById('player');
			container.insertBefore(player, container.firstChild);

			if (selected.height == 0) {
				player.width = 256; // hack for audio
				player.height = 256;
			}
			showControlPanel();

			player.addEventListener('touchstart', function(event) {
				event.preventDefault();
				if (controlPanel.style.opacity == 1.0) {
					hideControlPanel();
				} else {
					showControlPanel();
				}
			});

			document.querySelector('.play').style.display = 'inline';
			document.querySelector('.pause').style.display = 'none';
			player.addEventListener('play', function() {
				document.querySelector('.play').style.display = 'none';
				document.querySelector('.pause').style.display = 'inline';
			});
			player.addEventListener('pause', function() {
				document.querySelector('.play').style.display = 'inline';
				document.querySelector('.pause').style.display = 'none';
			});
			player.addEventListener('ended', function() {
				document.querySelector('.play').style.display = 'inline';
				document.querySelector('.pause').style.display = 'none';
			});
			if (muted) {
				controls.querySelector('.mute').style.display = 'none';
				controls.querySelector('.unmute').style.display = 'inline';
			} else {
				controls.querySelector('.mute').style.display = 'inline';
				controls.querySelector('.unmute').style.display = 'none';
			}

			updateProgress();
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
			if (player.currentTime) {
				startTime = player.currentTime;
			}
			autoplay = (player.paused === false);
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
		var status = document.getElementById('status-view');
		status.className = 'status-invisible';
		status.textContent = '';

		OGVPlayer.initSharedAudioContext();
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

	function onclick(selector, listener) {
		var el = controls.querySelector(selector);

		el.addEventListener('click', listener);

		el.addEventListener('touchstart', function(event) {
			// :active doesn't work on iOS \o/
			el.classList.add('active');
			event.preventDefault();
		});
		el.addEventListener('touchcancel', function(event) {
			el.classList.remove('active');
			event.preventDefault();
		});
		el.addEventListener('touchend', function(event) {
			el.classList.remove('active');
			event.preventDefault();
			listener();
		});
	}

	onclick('.play', function() {
		if (player) {
			player.play();
		}
	});
	onclick('.pause', function() {
		if (player) {
			player.pause();
		}
	});
	onclick('.mute', function() {
		if (player) {
			player.muted = true;
		}
		mute = true;
		controls.querySelector('.mute').style.display = 'none';
		controls.querySelector('.unmute').style.display = 'inline';
		setHash();
	});
	onclick('.unmute', function() {
		if (player) {
			player.muted = false;
		}
		mute = false;
		controls.querySelector('.mute').style.display = 'inline';
		controls.querySelector('.unmute').style.display = 'none';
		setHash();
	});
	document.querySelector('#progress-total').addEventListener('click', function(event) {
		if (player && player.seekable.length) {
			var x = event.offsetX,
				fraction = x / this.offsetWidth,
				seekTime = fraction * player.duration;
			player.currentTime = seekTime;
		}
	});
	if (window.PointerEvent) {
		document.querySelector('#progress-thumb').addEventListener('pointerdown', function(event) {
			console.log('touch start');
			if (player && player.seekable.length) {
				var thumbPointer = event.pointerId;
				event.target.setPointerCapture(thumbPointer);

				thumbSeeking = true;
				seekTarget = player.currentTime;
				initialThumbFraction = seekTarget / player.duration;
				initialThumbX = event.clientX;

				var ontouchmove = function(event) {
					console.log('touch move');
					var bar = document.querySelector('#progress-total'),
						dx = event.clientX - initialThumbX,
						fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
					seekTarget = fraction * player.duration;
					player.currentTime = seekTarget;
					updateProgress();
					event.preventDefault();
				};
				var ontouchup = function(event) {
					console.log('touch up');
					thumbSeeking = false;
					player.currentTime = seekTarget;
					updateProgress();

					this.removeEventListener('pointermove', ontouchmove);
					this.removeEventListener('pointerup', ontouchup);
					this.removeEventListener('pointercancel', ontouchup);
					event.preventDefault();
					event.target.releasePointerCapture(thumbPointer);
				};
				this.addEventListener('pointermove', ontouchmove);
				this.addEventListener('pointerup', ontouchup);
				this.addEventListener('pointercancel', ontouchup);
			}
			event.preventDefault();
		});
	} else {
		document.querySelector('#progress-thumb').addEventListener('touchstart', function(event) {
			console.log('touch start');
			if (player && player.seekable.length) {
				thumbSeeking = true;
				seekTarget = player.currentTime;
				initialThumbFraction = seekTarget / player.duration;
				initialThumbX = event.touches[0].pageX;

				var ontouchmove = function(event) {
					console.log('touch move');
					var bar = document.querySelector('#progress-total'),
						dx = event.touches[0].pageX - initialThumbX,
						fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
					seekTarget = fraction * player.duration;
					player.currentTime = seekTarget;
					updateProgress();
					event.preventDefault();
				};
				var ontouchup = function(event) {
					console.log('touch up');
					thumbSeeking = false;
					player.currentTime = seekTarget;
					updateProgress();

					this.removeEventListener('touchmove', ontouchmove);
					this.removeEventListener('touchend', ontouchup);
					this.removeEventListener('touchcancel', ontouchup);
					event.preventDefault();
				};
				this.addEventListener('touchmove', ontouchmove);
				this.addEventListener('touchend', ontouchup);
				this.addEventListener('touchcancel', ontouchup);
			}
			event.preventDefault();
		});
		document.querySelector('#progress-thumb').addEventListener('mousedown', function(event) {
			if (player && player.seekable.length) {
				thumbSeeking = true;
				seekTarget = player.currentTime;
				initialThumbFraction = seekTarget / player.duration;
				initialThumbX = event.clientX;

				var onmove = function(event) {
					var bar = document.querySelector('#progress-total'),
						dx = event.clientX - initialThumbX,
						fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
					seekTarget = fraction * player.duration;
					player.currentTime = seekTarget;
					updateProgress();
					event.preventDefault();
				};
				var onmouseup = function(event) {
					var bar = document.querySelector('#progress-total'),
						dx = event.clientX - initialThumbX,
						fraction = clamp(initialThumbFraction + dx / bar.offsetWidth);
					seekTarget = fraction * player.duration;
					thumbSeeking = false;
					player.currentTime = seekTarget;
                                        //player.seekEnd(); //Need something like this
					updateProgress();

					document.removeEventListener('mousemove', onmove);
					document.removeEventListener('mouseup', onmouseup);
					event.preventDefault();
				};
				document.addEventListener('mousemove', onmove);
				document.addEventListener('mouseup', onmouseup);
			}
			event.preventDefault();
		});
	}

	onclick('.fullscreen', function() {
		var requestFullscreen = (container.requestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen || container.msRequestFullscreen).bind(container);
		requestFullscreen();
	});
	onclick('.unzoom', function() {
		var cancelFullscreen = (document.cancelFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen || document.msExitFullscreen).bind(document);
		cancelFullscreen();
	});
	function fullResizeVideo() {
		var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
		if (fullscreenElement == container) {
			controls.querySelector('.fullscreen').style.display = 'none';
			controls.querySelector('.unzoom').style.display = 'inline';
		} else {
			controls.querySelector('.fullscreen').style.display = 'inline';
			controls.querySelector('.unzoom').style.display = 'none';
		}
	}
	document.addEventListener('fullscreenchange', fullResizeVideo);
	document.addEventListener('mozfullscreenchange', fullResizeVideo);
	document.addEventListener('webkitfullscreenchange', fullResizeVideo);
	document.addEventListener('MSFullscreenChange', fullResizeVideo);

	var controlPanel = document.getElementById('control-panel');
	var playerTimeout;
	function hideControlPanel() {
		// don't hide if we're paused
		// @todo or are audio-only
		if (player && !player.paused) {
			if (controlPanel.style.opacity == 1.0) {
				controlPanel.style.opacity = 0.0;
			}
		}
		if (playerTimeout) {
			clearTimeout(playerTimeout);
			playerTimeout = null;
		}
	}
	function delayHideControlPanel() {
		playerTimeout = setTimeout(function() {
			playerTimeout = null;
			if (player && !player.paused) {
				controlPanel.style.opacity = 0.0;
			}
		}, 5000);
	}
	function showControlPanel() {
		if (controlPanel.style.opacity == 0.0) {
			controlPanel.style.opacity = 1.0;
		}
		if (playerTimeout) {
			clearTimeout(playerTimeout);
			playerTimeout = null;
		}
	}
	container.addEventListener('mousemove', function() {
		showControlPanel();
		delayHideControlPanel();
	});

	//nativePlayer.querySelector('.play').addEventListener('click', function() {
	//	nativeVideo.play();
	//}

	window.setInterval(function() {
		if (player && benchmarkData.length > 0) {
			showBenchmark();
			showAverageRate();
		}
	}, 1000);

})();
