(function() {
    
    // benchmark display for demo
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
            maxTime = fpsTarget * 3,
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
            averageVideoBitrate = info.videoBytes * 8 / info.playTime; // kbits/s
            averageAudioBitrate = info.audioBytes * 8 / info.playTime; // kbits/s

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

            document.getElementById('video-bitrate').textContent = Math.round(averageVideoBitrate);
            document.getElementById('audio-bitrate').textContent = Math.round(averageAudioBitrate);

            // keep it a rolling average
            player.resetPlaybackStats();
        }
    }

    var benchmark = window.benchmark = {
        init: function(aPlayer) {
            player = aPlayer;
            clearBenchmark();
        },
        setTargetFPS: function(fps) {
            benchmarkTargetFps = fps;
        },
        recordPoint: function(info) {
            recordBenchmarkPoint(info);
        },
        update: function() {
            if (benchmarkData.length > 0) {
                showBenchmark();
                showAverageRate();
            }
        }
    }

})();
