package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.media.SoundTransform;
    import flash.utils.setTimeout;
    import flash.system.Security;

    public class dynamicaudio extends Sprite implements ILogger {
        private var bufferSize:Number = 4096; // In samples
        private var sound:Sound = null;
        private var soundChannel:SoundChannel = null;
        private var queue:BufferQueue;
        private var played:BufferQueue;
        private var logger:ILogger;

        private var queuedTime:Number = 0; // seconds; total amount of audio time we've processed
        private var delayedTime:Number = 0; // seconds; amount of audio time not accounted for, assumed dropped
        private var playbackTimeAtBufferTail:Number = 0; // seconds; expected playback time at the end of the buffer
        private var latency:Number = 0;
        private var dropped:Number = 0;
        private var targetRate:Number = 44100;
        private var volume:Number = 1;

        private var objectId:String = null;
        private var bufferThreshold:Number = 0;

        public function dynamicaudio() {
            // Uncomment this to spew some debug logs to the web side
            //logger = this;

            // If loaded cross-domain, we need to enable scripting access
            // to our public API methods. This should be safe as we only
            // do straight audio output, which any domain can do.
            setupCrossDomain();

            objectId = loaderInfo.parameters.objectId;
            queue = new BufferQueue(logger);
            played = new BufferQueue(logger);

            ExternalInterface.addCallback('write',  write);
            ExternalInterface.addCallback('getPlaybackState', getPlaybackState);
            ExternalInterface.addCallback('start', startPlayback);
            ExternalInterface.addCallback('stop', stopPlayback);
            ExternalInterface.addCallback('flush', flushData);
            ExternalInterface.addCallback('setVolume', setVolume);
            ExternalInterface.addCallback('setBufferSize', setBufferSize);
            ExternalInterface.addCallback('setBufferThreshold', setBufferThreshold);

            triggerCallback('ready');
        }

        private function setupCrossDomain():void {
            if (loaderInfo.url !== loaderInfo.loaderURL) {
                // If another SWF loaded us, don't enable cross-domain access.
                // It might, or might not, be unsafe.
                return;
            }
            if (Security.pageDomain === loaderInfo.url.substr(0, Security.pageDomain.length)) {
                // We're same-domain. No need to enable cross-domain access.
                return;
            }
            // We're cross-domain, but loaded directly into an HTML environment,
            // so this should only be enabling script access over ExternalInterface.
            Security.allowDomain('*');
        }

        // Called from JavaScript to add samples to the buffer
        // Note we are using a binary string of 32-bit float samples instead of an
        // array. Flash's stupid ExternalInterface passes every sample as XML,
        // which is incredibly expensive to encode/decode
        public function write(s:String):Object {
            log('writing ' + s.length);
            queue.append(new BufferQueueItem(s, 0, s.length, logger));
            return getPlaybackState();
        }

        public function startPlayback():void {
            log("starting playback");

            sound = new Sound();
            sound.addEventListener(
                SampleDataEvent.SAMPLE_DATA,
                soundGenerator
            );
            playbackTimeAtBufferTail = 0;
            soundChannel = sound.play();
            soundChannel.soundTransform = new SoundTransform(volume, 0);
        }

        public function stopPlayback():void {
            if (soundChannel) {
                var timeRemaining:Number = playbackTimeAtBufferTail - (soundChannel.position / 1000),
                    samplesRemaining:Number = Math.round(timeRemaining * targetRate);

                playbackTimeAtBufferTail = soundChannel.position / 1000;
                soundChannel.stop();

                log('stopPlayback samplesRemaining ' + samplesRemaining);
                if (samplesRemaining > 0) {
                    // There's some data we sent out already that didn't get played yet.
                    // Put it back at the beginning of the buffer...
                    var retained:BufferQueue = played.popSamples(samplesRemaining);
                    queuedTime -= (retained.sampleCount() / targetRate);
                    retained.prependTo(queue);
                    played.empty();
                }
            }
            soundChannel = null;
            sound = null;
        }

        public function flushData():void {
            // @todo also flush any current live data?
            queue.empty();
            played.empty();
        }

        public function getPlaybackState():Object {
            return {
                playbackPosition: playbackPosition(),
                samplesQueued: samplesQueued(),
                dropped: dropped,
                delayed: delayedTime
            };
        }

        public function samplesQueued():Number {
            return queue.sampleCount();
        }

        public function playbackPosition():Number {
            if (soundChannel == null) {
                return queuedTime;
            } else {
                return queuedTime - Math.max(0, playbackTimeAtBufferTail - (soundChannel.position / 1000));
            }
        }

        public function setVolume(val:Number):void {
          volume = val;
          if (soundChannel) {
              soundChannel.soundTransform = new SoundTransform(volume, 0);
          }
        }

        public function setBufferSize(val:Number):void {
          // Must write at least 2048 samples every time
          bufferSize = Math.max(2048, val);
        }

        public function setBufferThreshold(val:Number):void {
          bufferThreshold = Math.max(0, val);
        }

        public function soundGenerator(event:SampleDataEvent):void {
            var playbackTime:Number = (event.position / targetRate);

            var expectedTime:Number = playbackTimeAtBufferTail;
            if (expectedTime < playbackTime) {
                // we may have lost some time while something ran too slow
                delayedTime += (playbackTime - expectedTime);
            }

            if (queue.sampleCount() < bufferSize) {
                // go ping the decoder and let it know we need more data now!
                log('starved at ' + queue.sampleCount());
                triggerCallback('starved');
                if (!soundChannel) {
                  dropped++;
                  log('dropped');
                  return;
                }
            }

            // If we haven't got enough data, write a buffer of silence to
            // both channels (must be at least 2048 samples to keep audio running)
            log('sampleCount at play time: ' + queue.sampleCount());
            if (queue.sampleCount() < bufferSize) {
                for (var i:int = 0; i < bufferSize; i++) {
                    event.data.writeFloat(0.0);
                    event.data.writeFloat(0.0);
                }
                dropped++;
                log('dropped');
                return;
            }

            var playable:BufferQueue = queue.shiftSamples(bufferSize);
            log('playable sampleCount: ' + playable.sampleCount());
            playable.writeToOutput(event.data);

            var sampleCount:Number = playable.sampleCount();
            queuedTime += sampleCount / targetRate;
            playbackTimeAtBufferTail = playbackTime + sampleCount / targetRate;

            // Save the portion we played in case we have to stop
            // and continue from this position...
            playable.appendTo(played);
            while(played.sampleCount() > bufferThreshold) {
                played.shift();
            }

            if (queue.sampleCount() < Math.max(bufferSize, bufferThreshold)) {
                // This is an async callback, but there is not seemingly
                // a nextTick / setImmediate equivalent in Flash, and
                // setTimeout(foo, 0) gets throttled in background tabs.
                // Let the browser deal with the async side.
                log('bufferlow at ' + queue.sampleCount());
                triggerCallback('bufferlow');
            }
        }

        private function triggerCallback(eventName:String):void {
            if (objectId !== null) {
                ExternalInterface.call('AudioFeederFlashBackendCallback' + objectId, eventName);
            }
        }

        public function log(msg:String):void {
            if (logger == this) {
                ExternalInterface.call('AudioFeederFlashBackendCallback' + objectId, 'log', msg);
            } else if (logger) {
                logger.log(msg);
            }
        }
    }
}
