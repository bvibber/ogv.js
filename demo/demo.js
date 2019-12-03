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

	var auto = OGVLoader.wasmSupported() ? 'wasm' : 'js';
	document.getElementById('auto-select').text += ' (' + auto + ')';

    var player;

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
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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
        if (sourceMode == 'clean') {
            baseUrl = 'https://media-streaming.wmflabs.org/clean';
        }
        return baseUrl + '/transcoded/' + hash + '/' + filename + '/' + filename + '.' + height + 'p.' + format;
    }

    var av1base = 'https://media-streaming.wmflabs.org/clean/av1-2/';
    window.av1map = {
        "File:Caminandes- Llama Drama - Short Movie.ogv":
            av1base + 'caminandes-llama-drama.ogv',
        "File:Caminandes, Gran Dillama - Blender Foundation.webm":
            av1base + 'caminandes-gran-dillama.webm',
        "File:Caminandes 3 - Llamigos - Blender Animated Short.webm":
            av1base + 'caminandes-llamigos.webm',
        "File:Curiosity's Seven Minutes of Terror.ogv":
            av1base + 'curiosity.ogv',
        "File:Mosquitoes vs painted turtle (Chrysemys picta).webm":
            av1base + 'mosquitos.webm',
        "File:Spring Morning over a Frog Pond at the base of a face of Okanagan Mountain.webm":
            av1base + 'spring-morning.webm',
        "File:Tears of Steel in 4k - Official Blender Foundation release.webm":
            av1base + 'tears.webm',
    };

    /**
     * @param String media
     * @param function({duration}, [{format, title, width, height, url}]) callback
     */
    function findSourcesForMedia(media, callback) {
        media = media.replace(/_/g, ' ');
        commonsApi({
            action: 'query',
            prop: 'videoinfo',
            titles: media,
            viprop: 'url|size|mediatype|metadata|derivatives',
            viurlwidth: 1280,
            viurlheight: 720,
            redirects: 1
        }, function(data, err) {

            var sources = [],
                page = firstPageInApiResult(data);
            if (page && ('videoinfo' in page)) {
                // yay
            } else {
                console.log("Skipping missing image data");
                console.log(page);
                return;
            }

            var imageinfo = page.videoinfo[0],
                derivatives = imageinfo.derivatives;

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

            // Build entries for the transcodes
            var sourceMode = document.querySelector('#media-source').value;
            if (sourceMode == 'clean') {
                var sizes = [160, 240, 360, 480, 720, 1080, 1440, 2160],
                    widths = [284, 426, 640, 854, 1280, 1920, 2560, 3840],
                    formats = ['ogv', 'webm', 'vp9.webm'];
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
            } else if (sourceMode == 'av1') {
                var sizes = [120, 180, 240, 360, 480, 720, 1080],
                    widths = [213, 320, 426, 640, 854, 1280, 1920],
                    formats = ['av1.webm'];
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
                                url: av1map[media] + '.' + width + 'x' + size + '.' + format,
                            });
                        }
                    });
                });
            } else {
                // Build an entry for the original media
                var ext = getExtension(imageinfo.url),
                    format,
                    useOriginal = true;
                if (ext == 'ogg') {
                    format = 'ogv'; // todo: check video/audioness
                } else if (ext == 'ogv') {
                    format = 'ogv';
                } else if (ext == 'oga') {
                  // uhhhh.
                  format = 'oga';
                } else if (ext == 'opus') {
                  format = 'opus';
                } else if (ext == 'webm') {
                    format = 'webm';
                } else {
                    console.log("Unexpected file extension " + ext);
                    format = ext;
                    useOriginal = false;
                }
                if (useOriginal) {
                    sources.push({
                        key: 'original',
                        format: format,
                        width: imageinfo.width,
                        height: imageinfo.height,
                        url: imageinfo.url,
                        size: imageinfo.size,
                        bitrate: imageinfo.size * 8 / mediaInfo.duration
                    });
                }
                if (derivatives) {
                    for (var i = 0; i < derivatives.length; i++) {
                        var transcode = derivatives[i];
                        if ('transcodekey' in transcode) {
                            var key = transcode.transcodekey;
                            var format, height, matches;
                            matches = key.match(/^(\d+)p\.(.*?)$/);
                            if (matches) {
                                format = matches[2];
                            } else {
                                format = key;
                            }
                            sources.push({
                                key: key,
                                format: format,
                                width: transcode.height,
                                height: transcode.width,
                                url: transcode.src,
                                size: Math.round(transcode.bandwidth * mediaInfo.duration / 8),
                                bitrate: transcode.bandwidth
                            });
                        }
                    }
                }
            }

            callback(mediaInfo, sources);
        });
    }

    var container = document.getElementById('player'),
        videoChooser = document.getElementById('video-chooser'),
        selectedTitle = null,
        selectedUrl = null,
        skipAudio = false,
        playerBackend = 'auto',
        muted = false,
        startTime = 0,
        autoplay = false;

    var mediaList = document.getElementById('media-list'),
        filter = document.getElementById('filter');

    function getDefault() {
        if (document.location.hash.length > 1) {
            var title;
            playerBackend = 'auto';
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
            searchQuery = null,
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
            searchQuery = 'filetype:video incategory:"Media of the Day" ' + filterString;
        } else if (sourceMode == 'commons') {
            searchQuery = 'filetype:video ' + filterString;
        } else if (sourceMode == 'commons-audio') {
          searchQuery = 'filetype:audio ' + filterString;
        } else if (sourceMode == 'clean') {
          var shortlist = [
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

              // Wikipedia stuff
              [
                  "File:Women in botany and Wikipedia.webm",
                  '2160p24',
                  'UHD source'
              ],
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
              ],
              [
                  "File:President Obama Sings \"Sweet Home Chicago\".webm",
                  '720p59.94',
                  'live action'
              ],
              [
                  "File:Inside the White House- The Kitchen Garden.webm",
                  '720p59.94',
                  'live action, mix of sources'
              ],
              [
                  "File:Spectator Mode for Job Simulator - a new way to display social VR footage.webm",
                  '1080p60',
                  'VR game footage'
              ],
              [
                  "File:Project CARS - Game of the Year Edition Launch Trailer.webm",
                  '1080p60',
                  'game footage'
              ]
          ];
          processList(shortlist);
        } else if (sourceMode === 'av1') {
            var shortlist = [
                [
                    "File:Caminandes- Llama Drama - Short Movie.ogv",
                    '1080p24',
                    'animation'
                ],
                [
                    "File:Caminandes, Gran Dillama - Blender Foundation.webm",
                    '1080p24',
                    'animation'
                ],
                [
                    "File:Caminandes 3 - Llamigos - Blender Animated Short.webm",
                    '1080p24',
                    'animation'
                ],
                [
                    "File:Curiosity's Seven Minutes of Terror.ogv",
                    '720p23.98',
                    'live-action with CG elements'
                ],
                [
                    "File:Mosquitoes vs painted turtle (Chrysemys picta).webm",
                    '1080p29.97',
                    'live-action nature'
                ],
                /*
                [
                    // Currently generated at wrong resolutions. whoops!
                    "File:Tears of Steel in 4k - Official Blender Foundation release.webm",
                    '2160p23.98',
                    'sci-fi live action with CGI'
                ],
                */
                [
                    "File:Spring Morning over a Frog Pond at the base of a face of Okanagan Mountain.webm",
                    '720p29.97',
                    'live action drone nature footage'
                ]
            ];
            processList(shortlist);
        } else {
            throw new Error('unexpected sourceMode');
        }

        mediaList.innerHTML = '';

        if (selection.length == 0 && searchQuery == null) {
            mediaList.appendChild(document.createTextNode('No matches'));
            return;
        }

        chooserState++;
        var state = chooserState;
        var apiCall = {
            action: 'query',
            prop: 'imageinfo',
            iiprop: 'url|size',
            iiurlwidth: 128 * devicePixelRatio,
            iiurlheight: 128 * devicePixelRatio,
        };
        if (searchQuery == null) {
          apiCall.titles = selection.join('|');
        } else {
          apiCall.generator = 'search';
          apiCall.gsrsearch = searchQuery;
          apiCall.gsrnamespace = 6;
          apiCall.gsrlimit = 50;
        }
        
        commonsApi(apiCall, function(data) {
            if (state == chooserState) {
                var pages,
                    mediaItems = {},
                    foundPages = [];

                if ('query' in data && 'pages' in data.query) {
                  pages = data.query.pages;
                } else {
                  pages = [];
                }
                for (var pageId in pages) {
                    if (pages.hasOwnProperty(pageId)) {
                        var page = pages[pageId];
                        if (page.imageinfo) {
                            var imageinfo = page.imageinfo[0];
                            mediaItems[page.title] = imageinfo;
                            foundPages.push(page.title);
                        }
                    }
                }
                if (searchQuery !== null) {
                  selection = foundPages;
                }
                if (selection.length == 0) {
                    mediaList.appendChild(document.createTextNode('No matches'));
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

    document.querySelector('#chooser-button').addEventListener('click', showChooser);

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
            showVideo();
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

        if (playerBackend != 'auto') {
            hash += '&player=' + encodeURIComponent(playerBackend);
        }

        var sizeKey = document.getElementById('video-preferred-size').value;
        hash += '&size=' + sizeKey;

        var mode = document.getElementById('media-source').value;
        if (mode == 'clean') {
            // nothin
        } else {
            hash += '&source=' + mode;
        }

        document.location.hash = hash;
    }

    var preferredKey = '360p.vp9.webm';
    if (OGVCompat.isSlow()) {
        preferredKey = '240p.vp9.webm';
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
            selector.innerHTML = '';

            function descriptionForKey(key) {
                var matches = key.match(/^(\d+p)\.(.+)$/);
                if (matches) {
                    var res = matches[1], format = matches[2];
                    if (format == 'ogv') {
                        return res + ' Ogg Theora';
                    } else if (format == 'webm') {
                        return res + ' WebM VP8';
                    } else if (format == 'lowcpu.webm') {
                        return res + ' WebM VP8 low-CPU';
                    } else if (format == 'vp9.webm') {
                        return res + ' WebM VP9';
                    } else if (format == 'av1.webm') {
                        return res + ' WebM AV1';
                    } else {
                        return res + ' ' + format;
                    }
                } else if (key == 'original') {
                    return 'Original';
                } else if (key == 'ogg') {
                    return 'Ogg Vorbis';
                } else if (key == 'opus') {
                    return 'Ogg Opus';
                } else {
                    return key;
                }
            }

            // Find the transcoded or original ogv stream for now
            var optionsMap = {};
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
                if (source.format == 'oga' || source.format == 'ogg' || source.format == 'opus') {
                    oga = source;
                }

                var option = document.createElement('option');
                option.textContent = descriptionForKey(source.key);
                option.value = source.key;
                selector.appendChild(option);

                optionsMap[source.key] = option;
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
                if (sources.length) {
                    selected = sources[0];
                } else {
                    throw new Error("No source found.");
                }
            } else {
                optionsMap[selected.key].selected = true;
            }

            selectedUrl = selected.url;
            console.log("Going to try streaming data from " + selectedUrl);

            if (player) {
                // this should not happen
                stopVideo();
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
            //debugFilter = /late frame/;
            //debugFilter = /setting a timer/;
            //debugFilter = /ended|ending|end |demuxer/i;
            //debugFilter = /play loop.*(draw|frame)/;
            if (playerBackend == 'auto') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                });
            } else if (playerBackend == 'js') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: false
                });
            } else if (playerBackend == 'js-cpu') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    webGL: false, // force 2d canvas
                    wasm: false
                });
            } else if (playerBackend == 'js-noworker') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    worker: false, // experimental
                    wasm: false
                });
            } else if (playerBackend == 'wasm') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: true // force
                });
            } else if (playerBackend == 'wasm-noworker') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    worker: false,
                    wasm: true // force
                });
            } else if (playerBackend == 'wasm-cpu') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    webGL: false, // force 2d canvas
                    wasm: true // force
                });
            } else if (playerBackend == 'wasm-simd') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: true,
                    simd: true // experimental
                });
            } else if (playerBackend == 'wasm-mt') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: true,
                    threading: true // experimental
                });
            } else if (playerBackend == 'wasm-simd-mt') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: true,
                    threading: true, // experimental
                    simd: true // experimental
                });
            } else if (playerBackend == 'wasm-video') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    wasm: true,
                    video: true // experimental
                });
            } else if (playerBackend == 'webgl') {
                player = new OGVPlayer({
                    debug: !!debugFilter,
                    debugFilter: debugFilter,
                    forceWebGL: true
                });
            } else if (playerBackend == 'native') {
                player = document.createElement('video');
            } else {
                throw new Error('unknown player backend');
            }
            // for convenience
            window.o = player;


            document.getElementById('video-fps').textContent = '';
            document.getElementById('video-pic-width').textContent = '';
            document.getElementById('video-pic-height').textContent = '';
            document.getElementById('video-jitter').textContent = '';
            document.getElementById('audio-channels').textContent = '';
            document.getElementById('audio-rate').textContent = '';
            document.getElementById('audio-drops').textContent = '';
            document.getElementById('video-bitrate').textContent = '0';
            document.getElementById('audio-bitrate').textContent = '0';

            player.addEventListener('loadedmetadata', function() {
                // Standard metadata ain't much.
                document.getElementById('video-pic-width').textContent = player.videoWidth;
                document.getElementById('video-pic-height').textContent = player.videoHeight;

                // And grab our custom metadata...
                var fps;
                if (typeof (player.ogvjsVideoFrameRate) === 'number' && player.ogvjsVideoFrameRate > 0) {
                    benchmark.setTargetFPS(player.ogvjsVideoFrameRate);
                    fps = Math.round(player.ogvjsVideoFrameRate * 100) / 100;
                } else {
                    // Native video element doesn't seem to expose frame rate?!
                    benchmark.setTargetFPS(60);
                    fps = '?';
                }
                document.getElementById('video-fps').textContent = fps;

                if (typeof player.ogvjsAudioChannels === 'number') {
                    document.getElementById('audio-channels').textContent = player.ogvjsAudioChannels;
                    document.getElementById('audio-rate').textContent = player.ogvjsAudioSampleRate;
                }
            });

            // There is a 'timeupdate' event on HTMLMediaElement, but it only
            // seems to fire every quarter second. No per-frame callback for
            // native video, sorry!
            player.addEventListener('framecallback', function(info) {
                benchmark.recordPoint(info);
            });

            if (startTime == 0) {
                player.poster = mediaInfo.thumburl;
            }
            player.src = selectedUrl;
            player.muted = muted;
            player.playbackRate = document.querySelector('#pbr-slider').value/100.0;
            player.addEventListener('loadedmetadata', function() {
                if (startTime) {
                    player.currentTime = startTime;
                    if (autoplay) {
                        player.play();
                    }
                }
            });
            player.addEventListener('volumechange', function() {
                if (muted != player.muted) {
                    muted = player.muted;
                    setHash();
                }
            });

            var container = document.getElementById('player');
            container.insertBefore(player, container.firstChild);

            if (selected.height == 0) {
                player.width = 256; // hack for audio
                player.height = 256;
            }

            controls.init(player);
            benchmark.init(player);
        });
    }

    var selectedTitle = getDefault();
    //showChooser();
    showVideo();

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

    container.addEventListener('dragover', function(event) {
        // seem to need this :P
        event.preventDefault();
    });
    container.addEventListener('drop', function(event) {
        event.preventDefault();
        if (event.dataTransfer.items) {
            var item = event.dataTransfer.items[0];
            if (item.kind === 'file') {
                var file = item.getAsFile();
                var url = URL.createObjectURL(file);
                player.src = url;
                player.load();
            }
        }
    });

    // Control for Playback Rate (pbr) slider and reset button
    var pbrSlider = document.querySelector('#pbr-slider');
    pbrSlider.addEventListener('change', function(evt) {
        if (player) player.playbackRate = pbrSlider.value/100.0;
    });
    document.querySelector('#pbr-reset').addEventListener('click', function(evt) {
        pbrSlider.value = 100; if (player) player.playbackRate = 1.0;
    });

    window.setInterval(function() {
        if (player) {
            benchmark.update();
        }
    }, 1000);

})();
