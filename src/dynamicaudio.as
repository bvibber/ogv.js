package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.utils.setTimeout;

    public class dynamicaudio extends Sprite {
        public var bufferSize:Number = 4096; // In samples
        public var sound:Sound = null;
        public var soundChannel:SoundChannel = null;
        public var stringBuffer:Vector.<String> = new Vector.<String>();
        public var buffer:Vector.<Number> = new Vector.<Number>();
        public var liveBuffer:Vector.<Number> = null;
        public var multiplier:Number = 1/16384; // smaller than 32768 to allow some headroom from those floats;
        public var hexValues:Vector.<int> = new Vector.<int>(256);

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
            ExternalInterface.addCallback('write',  write);
            ExternalInterface.addCallback('getPlaybackState', getPlaybackState);
            ExternalInterface.addCallback('start', startPlayback);
            ExternalInterface.addCallback('stop', stopPlayback);
            ExternalInterface.addCallback('flush', flushData);
            ExternalInterface.addCallback('setVolume', setVolume);
            ExternalInterface.addCallback('setBufferSize', setBufferSize);
            ExternalInterface.addCallback('setBufferThreshold', setBufferThreshold);

            // Create a hex digit lookup table
            var hexDigits:Array = ['0', '1', '2', '3', '4', '5', '6', '7',
                                   '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
            for (var i:int = 0; i < hexDigits.length; i++) {
                this.hexValues[hexDigits[i].charCodeAt(0)] = i;
            }

            objectId = loaderInfo.parameters.objectId;
            triggerCallback('ready');
        }

        // Called from JavaScript to add samples to the buffer
        // Note we are using a hex string of 16-bit int samples instead of an
        // array. Flash's stupid ExternalInterface passes every sample as XML,
        // which is incredibly expensive to encode/decode
        public function write(s:String):void {
            // Decode the hex string asynchronously.
            stringBuffer.push(s);
            setTimeout(flushBuffers, 0);
            //flushBuffers();
        }

        public function startPlayback():void {
            sound = new Sound();
            sound.addEventListener(
                SampleDataEvent.SAMPLE_DATA,
                soundGenerator
            );
            playbackTimeAtBufferTail = 0;
            soundChannel = this.sound.play();
        }

        public function stopPlayback():void {
            if (soundChannel) {
                var timeRemaining:Number = playbackTimeAtBufferTail - (soundChannel.position / 1000),
                    samplesRemaining:Number = Math.round(timeRemaining * targetRate);

                playbackTimeAtBufferTail = soundChannel.position / 1000;
                soundChannel.stop();

                if (samplesRemaining > 0 && liveBuffer) {
                    // There's some data we sent out already that didn't get played yet.
                    // Put it back at the beginning of the buffer...
                    // @fixme liveBuffer often isn't big enough to cover the actual buffer, so this is partial.
                    var newbuffer:Vector.<Number> = new Vector.<Number>(),
                        retained:Number = Math.min(liveBuffer.length / 2, samplesRemaining),
                        start:Number = (liveBuffer.length / 2) - retained,
                        i:int;
                    for (i = start; i < liveBuffer.length / 2; i++) {
                        newbuffer.push(liveBuffer[i * 2]);
                        newbuffer.push(liveBuffer[i * 2 + 1]);
                    }
                    for (i = 0; i < buffer.length / 2; i++) {
                        newbuffer.push(buffer[i * 2]);
                        newbuffer.push(buffer[i * 2 + 1]);
                    }
                    buffer = newbuffer;
                    liveBuffer = null;

                    queuedTime -= (retained / targetRate);
                }
            }
            soundChannel = null;
            sound = null;
        }

        public function flushData():void {
            // @todo also flush any current live data?
            stringBuffer.splice(0, stringBuffer.length);
            buffer.splice(0, buffer.length);
        }

        public function flushBuffers():void {
            while (stringBuffer.length > 0) {
                var s:String = stringBuffer.shift();
                var hexValues:Vector.<int> = this.hexValues;
                for (var i:int = 0; i < s.length; i += 4) {
                    var sample:int = (hexValues[s.charCodeAt(i)]) |
                                     (hexValues[s.charCodeAt(i + 1)] << 4) |
                                     (hexValues[s.charCodeAt(i + 2)] << 8) |
                                     (hexValues[s.charCodeAt(i + 3)] << 12);
                    // sign extension to 32 bits via arithmetic shift
                    sample = (sample << 16) >> 16;
                    this.buffer.push(sample * multiplier);
                }
            }
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
            //flushBuffers();
            var stringsLength:int = 0;
            for (var i:int = 0; i < stringBuffer.length; i++) {
                stringsLength += stringBuffer[i].length / 2;
            }
            return stringsLength + buffer.length / 2;
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
        }

        public function setBufferSize(val:Number):void {
          // Must write at least 2048 samples every time
          bufferSize = Math.max(2048, val);
        }

        public function setBufferThreshold(val:Number):void {
          bufferThreshold = Math.max(0, val);
        }

        public function soundGenerator(event:SampleDataEvent):void {
            var i:int;
            flushBuffers();

            var playbackTime:Number = (event.position / targetRate);

            var expectedTime:Number = playbackTimeAtBufferTail;
            if (expectedTime < playbackTime) {
                // we may have lost some time while something ran too slow
                delayedTime += (playbackTime - expectedTime);
            }

            if (buffer.length < bufferSize * 2) {
                // go ping the decoder and let it know we need more data now!
                triggerCallback('starved');
            }

            // If we haven't got enough data, write a buffer of of silence to
            // both channels (must be at least 2048 samples to keep audio running)
            if (buffer.length < bufferSize * 2) {
                for (i = 0; i < bufferSize; i++) {
                    event.data.writeFloat(0.0);
                    event.data.writeFloat(0.0);
                }
                dropped++;
                return;
            }

            var sampleCount:Number = Math.min(buffer.length / 2, bufferSize);

            for (i = 0; i < sampleCount; i++) {
                event.data.writeFloat(buffer[i * 2] * volume);
                event.data.writeFloat(buffer[i * 2 + 1] * volume);
            }
            queuedTime += sampleCount / targetRate;
            playbackTimeAtBufferTail = playbackTime + sampleCount / targetRate;

            liveBuffer = buffer.slice(0, sampleCount * 2);
            buffer = buffer.slice(sampleCount * 2, buffer.length);

            if (buffer.length < Math.max(bufferSize, bufferThreshold) * 2) {
                // This is an async callback, but there is not seemingly
                // a nextTick / setImmediate equivalent in Flash, and
                // setTimeout(foo, 0) gets throttled in background tabs.
                // Let the browser deal with the async side.
                triggerCallback('bufferlow');
            }
        }

        public function triggerCallback(eventName:String):void {
            if (objectId !== null) {
                ExternalInterface.call('AudioFeederFlashBackendCallback' + objectId, eventName);
            }
        }
    }
}
