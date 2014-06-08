/**
 * High-level player interface wrapped around ogg/vorbis/theora libraries
 * cross-compiled with Crossbridge.
 *
 * Uses low-level interface in ogv-libs-mixin-flash.c + OgvCodec.as
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2014
 * @license MIT-style
 */
package {
    import flash.display.Bitmap;
    import flash.display.BitmapData;
    import flash.display.Loader;
    import flash.display.Sprite;
    import flash.display.Stage;
    import flash.display.StageAlign;
    import flash.display.StageScaleMode;
    import flash.events.AsyncErrorEvent;
    import flash.events.Event;
    import flash.events.IOErrorEvent;
    import flash.events.ProgressEvent;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.geom.Rectangle;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.net.URLRequest;
    import flash.net.URLStream;
    import flash.utils.ByteArray;
    import flash.utils.Endian;
    import flash.utils.IDataInput;
    import flash.utils.setTimeout;
    import flash.utils.clearTimeout;

    import OgvCodec;
    import YCbCrFrameSink;

    public class ogv extends Sprite {
        // Property backing vars
        private var src:String = "";
        private var poster:String = "";
        private var durationHint:Number = 0;
        private var byteLength:int = 0;

        // Playback state vars
        private var started:Boolean = false;
        private var paused:Boolean = true;
        private var ended:Boolean = false;
        private var muted:Boolean = false;

        // Metadata and internals...
        private var jsCallbackName:String = null;
        private var useGPU:Boolean = false;
        private var codec:OgvCodec = null;
        private var videoInfo:Object = null;
        private var audioInfo:Object = null;
        private var nextProcessingTimer:int = 0;

        // Networking state
        private var req:URLRequest = null;
        private var stream:URLStream = null;
        private var streamBufferSize:Number = 65536;
        private var streamComplete:Boolean = false;
        private var needInput:Boolean = false;
        private var bytesRead:int = 0;

        // Playback stats, in counts
        private var framesProcessed:Number = 0;
        private var framesPlayed:Number = 0;
        private var droppedAudio:Number = 0;
        // Playback stats, in ms
        private var targetPerFrameTime:Number = 1000 / 60;
        private var demuxingTime:Number = 0;
        private var videoDecodingTime:Number = 0;
        private var audioDecodingTime:Number = 0;
        private var bufferTime:Number = 0;
        private var colorTime:Number = 0;
        private var drawingTime:Number = 0;
        private var totalJitter:Number = 0;
        private var lastFrameDecodeTime:Number = 0;

        // Poster internals
        private var posterLoader:Loader = null;

        // Video internals
        private var fps:Number = 0;
        private var lastFrameTimestamp:Number = 0;
        private var frameEndTimestamp:Number = 0;
        private var targetFrameTime:Number = 0;
        
        // Software drawing internals
        private var pixelBuffer:ByteArray = null;
        private var bitmapData:BitmapData = null;
        private var bitmap:Bitmap = null;
        
        // GPU drawing internals
        private var frameSink:YCbCrFrameSink = null;

        // Audio internals
        private var audioBufferSize:Number = 4096; // In samples
        private var targetRate:Number = 44100; // Flash audio is always 44.1 kHz stereo
        private var sound:Sound = null;
        private var soundChannel:SoundChannel = null;
        private var audioBuffers:Vector.<Vector.<ByteArray>> = new Vector.<Vector.<ByteArray>>();
        private var starvedAudioTime:Number = 0; // seconds; amount of time spent "playing" when starved for audio
        private var totalBufferedAudio:Number = 0; // seconds; total amount of audio time we've processed
        private var droppedAudioTime:Number = 0; // seconds; amount of audio time not accounted for, assumed dropped

        // Log debug stuff to the JS console for convenience
        private function log(str:String):void {
            if (jsCallbackName == "") {
                trace(str);
            } else {
                jsCallback('ontrace', str);
            }
        }

        public function ogv() {
            // First, make the coordinate system sane.
            stage.scaleMode = StageScaleMode.NO_SCALE;
            stage.align = StageAlign.TOP_LEFT;
            x = 0;
            y = 0;
            // But this means we will have to manually set scale on the bitmap. Meh.
            stage.addEventListener(Event.RESIZE, function(event:Event):void {
                resizeForStage();

                // since it seems to lag a lot during browser resizes...
                setTimeout(resizeForStage, 1);
            });

            // Who you gonna call?
            jsCallbackName = loaderInfo.parameters.jsCallbackName;
            log('jsCallbackName: ' + jsCallbackName);
            
            // Should we use GPU rendering?
            useGPU = !!parseInt(loaderInfo.parameters.useGPU);

            // Aaaand, setup the codec.        
            codec = new OgvCodec({
                audio: true,
                video: true
            });
            codec.oninitaudio = function(info:Object):void {
                audioInfo = info;
                if (!sound) {
                    sound = new Sound(); 
                    sound.addEventListener(
                        SampleDataEvent.SAMPLE_DATA,
                        soundGenerator
                    );
                    soundChannel = sound.play();
                }
            };
            codec.oninitvideo = function(info:Object):void {
                videoInfo = info;
                fps = videoInfo.fps;
                targetPerFrameTime = 1000 / fps;

                if (useGPU) {
                    frameSink = new YCbCrFrameSink(stage, videoInfo);
                } else {
                    // Create our target bitmap!
                    var nbytes:int = videoInfo.frameWidth * videoInfo.frameHeight * 4;
                    pixelBuffer = new ByteArray();
                    pixelBuffer.length = nbytes;
                    for (var i:int = 0; i < nbytes; i++) {
                        // Prefill solid alpha (ARGB)
                        pixelBuffer.writeInt(0xff000000);
                    }
                    // @todo crop to the picture size
                    bitmapData = new BitmapData(videoInfo.frameWidth, videoInfo.frameHeight, true, 0xff000000);

                    bitmap = new Bitmap(bitmapData);
                    bitmap.smoothing = true;
                    // Offset the bitmap to 'crop' it conveniently
                    bitmap.x = -videoInfo.picX;
                    bitmap.y = -videoInfo.picY;
                    resizeForStage();
                    addChild(bitmap);
                }

                // Don't need this anymore...
                if (posterLoader) {
                    removeChild(posterLoader);
                    posterLoader = null;
                }
            };
            codec.onloadedmetadata = function():void {
                jsCallback('onloadedmetadata');
            };

            setupCallbacks();
        }

        private function resizeForStage():void {
            if (bitmap) {
                // Note the bitmap size is the frame size; it's offset
                // to let us crop it within the player area.
                bitmap.scaleX = stage.stageWidth / videoInfo.picWidth;
                bitmap.scaleY = stage.stageHeight / videoInfo.picHeight;
            }
            if (posterLoader) {
                posterLoader.width = stage.stageWidth;
                posterLoader.height = stage.stageHeight;
            }
            if (frameSink) {
                frameSink.onResize();
            }
        }

        private function getTimestamp():Number {
            // Is there a higher-resolution timer?
            // This gives only millisecond precision, which ain't great.
            //
            // Actually on Windows, it gives ~15ms precision, which is almost useless.
            // On Mac we get those milliseconds for real at least.
            return flash.utils.getTimer();
        }

        private function jsCallback(cb:String, args:*=null):void {
            // Call on next tick to avoid surprises
            setTimeout(function():void {
                ExternalInterface.call(jsCallbackName, cb, args);
            }, 0);
        }

        // External interface setup
        private function setupCallbacks():void {
            // your basic player controls!
            ExternalInterface.addCallback('_load', load);

            ExternalInterface.addCallback('_play', play);

            ExternalInterface.addCallback('_pause', pause);

            // Custom playback stats calls...
            ExternalInterface.addCallback('_getPlaybackStats', function _getPlaybackStats():Object {
                return {
                    targetPerFrameTime: targetPerFrameTime,
                    framesProcessed: framesProcessed,
                    demuxingTime: demuxingTime,
                    videoDecodingTime: videoDecodingTime,
                    audioDecodingTime: audioDecodingTime,
                    bufferTime: bufferTime,
                    colorTime: colorTime,
                    drawingTime: drawingTime,
                    droppedAudio: droppedAudio,
                    jitter: totalJitter / framesProcessed
                };
            });

            ExternalInterface.addCallback('_resetPlaybackStats', function _resetPlaybackStats():void {
                framesProcessed = 0;
                demuxingTime = 0;
                videoDecodingTime = 0;
                audioDecodingTime = 0;
                bufferTime = 0;
                colorTime = 0;
                drawingTime = 0;
                totalJitter = 0;
            });

            // Some properties
            ExternalInterface.addCallback('_setSrc', function _setSrc(_src:String):void {
                log("setting src: " + _src);
                src = _src;
                log("set src: " + src);
            });

            // Playback state
            ExternalInterface.addCallback('_getBufferedTime', function _getBufferedTime():Number {
                if (stream && byteLength && durationHint) {
                    return ((bytesRead + stream.bytesAvailable) / byteLength) * durationHint;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getCurrentTime', function _getCurrentTime():Number {
                if (codec && codec.hasAudio) {
                    return getPlaybackState().playbackPosition;
                } else if (codec && codec.hasVideo) {
                    return framesPlayed / fps;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getPaused', function _getPaused():Boolean {
                return paused;
            });
            ExternalInterface.addCallback('_getEnded', function _getEnded():Boolean {
                return ended;
            });
            ExternalInterface.addCallback('_setMuted', function _setMuted(_muted:Boolean):void {
                muted = _muted;
            });
            ExternalInterface.addCallback('_getMuted', function _getMuted():Boolean {
                return muted;
            });
            ExternalInterface.addCallback('_setPoster', function _setPoster(_poster:String):void {
                poster = _poster;
                loadPoster();
            });

            // Various metadata!
            ExternalInterface.addCallback('_setDurationHint', function _setDurationHint(_durationHint:Number):void {
                durationHint = _durationHint;
            });
            ExternalInterface.addCallback('_getDuration', function _getDuration():Number {
                return durationHint;
            });
            ExternalInterface.addCallback('_getVideoWidth', function _getVideoWidth():int {
                if (videoInfo) {
                    return videoInfo.picWidth;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getVideoHeight', function _getVideoHeight():int {
                if (videoInfo) {
                    return videoInfo.picHeight;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getFrameRate', function _getFrameRate():Number {
                if (videoInfo) {
                    return videoInfo.fps;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getAudioChannels', function _getAudioChannels():int {
                if (audioInfo) {
                    return audioInfo.channels;
                } else {
                    return 0;
                }
            });
            ExternalInterface.addCallback('_getAudioSampleRate', function _getAudioSampleRate():Number {
                if (audioInfo){
                    return audioInfo.rate;
                } else {
                    return 0;
                }
            });

            // The JS side will check that this callback has been added
            // to determine if we're ready to roll.
            ExternalInterface.addCallback('_isReady', function _isReady():Boolean {
                return true;
            });

        }

        private function loadPoster():void {
            if (bitmap == null) {
                if (posterLoader) {
                    removeChild(posterLoader);
                    posterLoader = null;
                }
                if (poster == "" || poster == null) {
                    // no poster for you
                } else {
                    var urlRequest:URLRequest = new URLRequest(poster);

                    posterLoader = new Loader();
                    posterLoader.x = 0;
                    posterLoader.y = 0;
                    posterLoader.width = stage.stageWidth;
                    posterLoader.height = stage.stageHeight;
                    posterLoader.load(urlRequest);
                    addChild(posterLoader);

                    posterLoader.contentLoaderInfo.addEventListener(Event.COMPLETE, function():void {
                        resizeForStage();
                    });
                }
            }
        }

        /**
         * Start loading the source file over the network.
         * Don't trigger any processing just yet.
         */
        public function load():void {
            log("ogv load! src: " + src);
            started = true;
            needInput = false;

            stream = new URLStream();
            stream.addEventListener(Event.OPEN, function _streamOnOpen(event:Event):void {
                log("open");
            });
            stream.addEventListener(ProgressEvent.PROGRESS, function _streamOnProgress(event:ProgressEvent):void {
                if (byteLength == 0) {
                    byteLength = event.bytesTotal;
                }
                if (needInput) {
                    needInput = false;
                    readStreamBytes();
                }
            });
            stream.addEventListener(Event.COMPLETE, function _streamOnComplete(event:Event):void {
                log("complete");
                streamComplete = true;
            });
            stream.addEventListener(IOErrorEvent.IO_ERROR, function _streamOnIOError(event:IOErrorEvent):void {
                log("error");
            });

            req = new URLRequest(src);
            stream.load(req);
        }

        private function readStreamBytes():void {
            if (stream.bytesAvailable >= streamBufferSize) {
                // Advance!
                bytesRead += streamBufferSize;
                codec.receiveInput(stream, streamBufferSize);
                pingProcessing(0);
            } else if (streamComplete) {
                bytesRead += stream.bytesAvailable;
                codec.receiveInput(stream, stream.bytesAvailable);
                pingProcessing(0);

                // Kill the stream...
                stream = null;
            } else {
                needInput = true;
                log("waiting for more data");
            }
        }

        public function play():void {
            log("ogv play! " + src);
            if (!started) {
                load();
            }
            if (paused) {
                paused = false;
                pingProcessing(0);
            }
            jsCallback('onplay');
        }

        public function pause():void {
            log("ogv pause!");
            if (!paused) {
                paused = true;
                if (nextProcessingTimer) {
                    clearTimeout(nextProcessingTimer);
                    nextProcessingTimer = 0;
                }
                jsCallback('onpause');
            }
        }

        private function pingProcessing(delay:Number):void {
            if (nextProcessingTimer) {
                // already scheduled
            } else {
                if (delay < 0) {
                    delay = 0;
                }
                nextProcessingTimer = setTimeout(doProcessing, delay);
            }
        }

        private function doProcessing():void {
            nextProcessingTimer = 0;

            var audioBufferedDuration:Number = 0;
            if (codec.hasAudio) {
                var audioState:Object = getPlaybackState();
                audioBufferedDuration = (audioState.samplesQueued / targetRate) * 1000;
            }

            var n:int = 0;
            while (true) {
                n++;
                if (n > 100) {
                    log("Got stuck in the loop!");
                    pingProcessing(10);
                    return;
                }
                // Process until we run out of data or
                // completely decode a video frame...
                var currentTime:Number = getTimestamp(),
                    start:Number,
                    delta:Number,
                    ok:Boolean;
                start = currentTime;

                var hasAudio:Boolean = codec.hasAudio,
                    hasVideo:Boolean = codec.hasVideo;
                var more:Boolean = codec.process();
                if (hasAudio != codec.hasAudio || hasVideo != codec.hasVideo) {
                    // we just fell over from headers into content; reinit
                    lastFrameTimestamp = getTimestamp();
                    targetFrameTime = lastFrameTimestamp + 1000.0 / fps
                    pingProcessing(0);
                    return;
                }

                delta = (getTimestamp() - start);
                lastFrameDecodeTime += delta;
                demuxingTime += delta;

                if (!more) {
                    if (stream) {
                        // Ran out of buffered input
                        readStreamBytes();
                    } else {
                        // Ran out of stream!
                        var finalDelay:Number = 0;
                        if (hasAudio) {
                            if (durationHint) {
                                finalDelay = durationHint * 1000 - audioState.playbackPosition;
                            } else {
                                finalDelay = audioBufferedDuration;
                            }
                        }
                        log('End of stream reached in ' + finalDelay + ' ms.');
                        setTimeout(function():void {
                            ended = true;
                            jsCallback('onended');
                        }, finalDelay);
                    }
                    return;
                }

                if ((hasAudio || hasVideo) && !(codec.audioReady || codec.frameReady)) {
                    // Have to process some more pages to find data. Continue the loop.
                    continue;
                }

                if (hasAudio) {
                    // Drive on the audio clock!
                    var fudgeDelta:Number = 0.1,
                        readyForAudio:Boolean = audioState.samplesQueued <= (audioBufferSize * 2),
                        frameDelay:Number = (frameEndTimestamp - audioState.playbackPosition) * 1000,
                        readyForFrame:Boolean = (frameDelay <= fudgeDelta);
                    var startTimeSpent:Number = getTimestamp();
                    if (codec.audioReady && readyForAudio) {
                        start = getTimestamp();
                        ok = codec.decodeAudio();
                        delta = (getTimestamp() - start);
                        lastFrameDecodeTime += delta;
                        audioDecodingTime += delta;

                        start = getTimestamp();
                        if (ok) {
                            var buffer:Vector.<ByteArray> = codec.dequeueAudio();
                            audioBufferedDuration += queueAudio(buffer);
                        }
                    }
                    if (codec.frameReady && readyForFrame) {
                        start = getTimestamp();
                        ok = codec.decodeFrame();
                        delta = (getTimestamp() - start);
                        lastFrameDecodeTime += delta;
                        videoDecodingTime += delta;
                        if (ok) {
                            drawFrame();
                        } else {
                            // Bad packet or something.
                            log('Bad video packet or something');
                        }
                        targetFrameTime = currentTime + 1000.0 / fps;
                    }

                    // Check in when all audio runs out
                    var bufferDuration:Number = (audioBufferSize / targetRate) * 1000;
                    var nextDelays:Array = [];
                    if (audioBufferedDuration <= bufferDuration * 2) {
                        // NEED MOAR BUFFERS
                    } else {
                        // Check in when the audio buffer runs low again...
                        nextDelays.push(bufferDuration / 2);

                        if (hasVideo) {
                            // Check in when the next frame is due
                            // Subtract time we already spent decoding
                            var deltaTimeSpent:Number = getTimestamp() - startTimeSpent;
                            nextDelays.push(frameDelay - deltaTimeSpent);
                        }
                    }

                    //log([n, audioState.playbackPosition, frameEndTimestamp, audioBufferedDuration, bufferDuration, frameDelay, '[' + nextDelays.join("/") + ']'].join(", "));
                    var nextDelay:Number = Math.min.apply(Math, nextDelays);
                    if (nextDelays.length > 0) {
                        pingProcessing(nextDelay - delta);
                        return;
                    }
                } else if (hasVideo) {
                    // Video-only: drive on the video clock
                    if (codec.frameReady && getTimestamp() >= targetFrameTime) {
                        // it's time to draw
                        start = getTimestamp();
                        ok = codec.decodeFrame();
                        delta = (getTimestamp() - start);
                        lastFrameDecodeTime += delta;
                        videoDecodingTime += delta;
                        if (ok) {
                            drawFrame();
                            targetFrameTime += 1000.0 / fps;
                            pingProcessing(0);
                        } else {
                            log('Bad video packet or something');
                            pingProcessing(targetFrameTime - getTimestamp());
                        }
                    } else {
                        // check in again soon!
                        pingProcessing(targetFrameTime - getTimestamp());
                    }
                    return;
                } else {
                    // Ok we're just waiting for more input.
                    log('Still waiting for headers...');
                }
            }
        }

        // Audio output functions...
        /**
         * @return length of queued buffer in milliseconds
         */
        private function queueAudio(buffer:Vector.<ByteArray>):Number {
            var bufSamples:int = buffer[0].length / 4;
            audioBuffers.push(resampleAudio(buffer));
            return (bufSamples / audioInfo.rate) * 1000;
        }

        /**
         * Resample an audio buffer to the target output rate.
         * Very approximate and may round poorly when uneven.
         */
        private function resampleAudio(samples:Vector.<ByteArray>):Vector.<ByteArray> {
            var rate:int = audioInfo.rate,
                channels:int = audioInfo.channels;
            if (rate == targetRate) {
                return samples;
            } else {
                var newSamples:Vector.<ByteArray> = new Vector.<ByteArray>();
                for (var channel:int = 0; channel < channels; channel++) {
                    var input:ByteArray = samples[channel],
                        output:ByteArray = new ByteArray(),
                        inSampleCount:int = input.length / 4,
                        outSampleCount:int = Math.round(inSampleCount * targetRate / rate);

                    input.position = 0;
                    var outIndex:int = 0;
                    for (var i:int = 0; i < inSampleCount; i++) {
                        var sample:Number = input.readFloat();
                        var targetIndex:int = Math.floor(i * outSampleCount / inSampleCount);
                        while (outIndex <= targetIndex) {
                            output.writeFloat(sample);
                            outIndex++;
                        }
                    }
                    if (output.length != (outSampleCount * 4)) {
                        trace('unexpected; ' + inSampleCount + '; ' + outSampleCount + ';' + output.length);
                    }
                    newSamples[channel] = output;
                }
                return newSamples;
            }
        }

        // Video output functions...
        private function drawFrame():void {
            var yCbCrBuffer:Object = codec.dequeueFrame();
            frameEndTimestamp = yCbCrBuffer.timestamp;

            var start:Number, delta:Number;

            if (useGPU) {
                start = getTimestamp();
                frameSink.drawFrame(yCbCrBuffer);
                delta = getTimestamp() - start;
            } else {
                // colorspace conversion        	
                start = getTimestamp();
                var bytesARGB:ByteArray = codec.convertYCbCr(yCbCrBuffer);
                delta = getTimestamp() - start;
                colorTime += delta;
                lastFrameDecodeTime += delta;

                // drawing
                start = getTimestamp();
                var rect:Rectangle = new Rectangle(0, 0, videoInfo.frameWidth, videoInfo.frameHeight);
                bytesARGB.position = 0;
                bitmapData.setPixels(rect, bytesARGB);
                delta = getTimestamp() - start;
            }

            lastFrameDecodeTime += delta;
            drawingTime += delta;
            framesProcessed++;
            framesPlayed++;

            doFrameComplete();
        }

        private function doFrameComplete():void {
            var newFrameTimestamp:Number = getTimestamp(),
                wallClockTime:Number = newFrameTimestamp - lastFrameTimestamp,
                jitter:Number = Math.abs(wallClockTime - 1000 / videoInfo.fps);
            totalJitter += jitter;

            jsCallback('onframecallback', {
                cpuTime: lastFrameDecodeTime,
                clockTime: wallClockTime
            });
            lastFrameDecodeTime = 0;
            lastFrameTimestamp = newFrameTimestamp;
        }

        // Audio output functions...
        private function getPlaybackState():Object {
            return {
                playbackPosition: playbackPosition(),
                samplesQueued: samplesQueued(),
                dropped: droppedAudio
            };
        }

        private function samplesQueued():Number {
            var sampleCount:int = 0;
            for (var i:int = 0; i < audioBuffers.length; i++) {
                sampleCount += audioBuffers[i][0].length / 4;
            }
            return sampleCount;
        }

        private function playbackPosition():Number {
            if (soundChannel == null) {
                return 0;
            } else {
                return soundChannel.position / 1000 - starvedAudioTime - droppedAudioTime;
            }
        }

        private function soundGenerator(event:SampleDataEvent):void {
            var i:int;
            var samplesWritten:int = 0;
            var leftSample:Number, rightSample:Number;

            droppedAudioTime = (event.position / targetRate) - totalBufferedAudio;
            while (samplesWritten < audioBufferSize) {

                if (audioBuffers.length == 0) {
                    //log('dropped audio!');
                    // Out of data? Write some silence to round it out,
                    // and wait for the next set of data...
                    droppedAudio++;
                    starvedAudioTime += (audioBufferSize - samplesWritten) / 44100;
                    while (samplesWritten < audioBufferSize) {
                        event.data.writeFloat(0.0);
                        event.data.writeFloat(0.0);

                        samplesWritten++;
                    }
                } else {
                    var buffer:Vector.<ByteArray> = audioBuffers.shift();

                    var channel0:ByteArray = buffer[0];
                    channel0.position = 0;

                    var bufSamples:int = channel0.length / 4;

                    var channel1:ByteArray;
                    if (buffer.length > 1) {
                        // @todo downmix >2 channels
                        channel1 = buffer[1];
                        channel1.position = 0;
                    } else {
                        channel1 = null;
                    }

                    // Vorbis gave us separate channels, Flash wants interleaved samples.
                    for (i = 0; i < bufSamples; i++) {
                        leftSample = channel0.readFloat();
                        if (channel1 == null) {
                            rightSample = leftSample;
                        } else {
                            rightSample = channel1.readFloat();
                        }

                        event.data.writeFloat(leftSample);
                        event.data.writeFloat(rightSample);

                        samplesWritten++;
                    }
                }
            }
            totalBufferedAudio += samplesWritten / targetRate;
        }
    }
}
