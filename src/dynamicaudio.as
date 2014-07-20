package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    import flash.utils.setTimeout;

    public class dynamicaudio extends Sprite {
        public var bufferSize:Number = 8192; // In samples
        public var sound:Sound = null;
        public var soundChannel:SoundChannel = null;
        public var stringBuffer:Vector.<String> = new Vector.<String>();
        public var buffer:Vector.<Number> = new Vector.<Number>();
        public var multiplier:Number = 1/16384; // smaller than 32768 to allow some headroom from those floats;
        public var hexValues:Vector.<int> = new Vector.<int>(256);

        private var starvedAudioTime:Number = 0; // seconds; amount of time spent "playing" when starved for audio
        private var totalBufferedAudio:Number = 0; // seconds; total amount of audio time we've processed
        private var droppedAudioTime:Number = 0; // seconds; amount of audio time not accounted for, assumed dropped
        private var dropped:Number = 0;
        private var targetRate:Number = 44100;

        public function dynamicaudio() {
            ExternalInterface.addCallback('write',  write);
            ExternalInterface.addCallback('getPlaybackState', getPlaybackState);

            // Create a hex digit lookup table
            var hexDigits:Array = ['0', '1', '2', '3', '4', '5', '6', '7',
                                   '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
            for (var i:int = 0; i < hexDigits.length; i++) {
                this.hexValues[hexDigits[i].charCodeAt(0)] = i;
            }
        }

        // Called from JavaScript to add samples to the buffer
        // Note we are using a hex string of 16-bit int samples instead of an
        // array. Flash's stupid ExternalInterface passes every sample as XML, 
        // which is incredibly expensive to encode/decode
        public function write(s:String):void {
            // Decode the hex string asynchronously.
            stringBuffer.push(s);
            setTimeout(flushBuffers, 0);
        }

        public function flushBuffers():void {
            if (!this.sound) {
                this.sound = new Sound();
                this.sound.addEventListener(
                    SampleDataEvent.SAMPLE_DATA,
                    soundGenerator
                );
                this.soundChannel = this.sound.play();
            }

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
                dropped: dropped
            };
        }

        public function samplesQueued():Number {
            flushBuffers();
            return buffer.length / 2;
        }

        public function playbackPosition():Number {
            if (soundChannel == null) {
                return 0;
            } else {
                return soundChannel.position / 1000 - starvedAudioTime - droppedAudioTime;
            }
        }

        public function soundGenerator(event:SampleDataEvent):void {
            var i:int;
            flushBuffers();

            droppedAudioTime = (event.position / targetRate) - totalBufferedAudio;

            // If we haven't got enough data, write 2048 samples of silence to 
            // both channels, the minimum Flash allows
            if (buffer.length < bufferSize) {
                for (i = 0; i < bufferSize; i++) {
                    event.data.writeFloat(0.0);
                    event.data.writeFloat(0.0);
                }
                starvedAudioTime += (bufferSize / targetRate);
                totalBufferedAudio += bufferSize / targetRate;
                dropped++;
                return;
            }

            var sampleCount:Number = Math.min(buffer.length / 2, bufferSize);

            for (i = 0; i < sampleCount; i++) {
                event.data.writeFloat(buffer[i * 2]);
                event.data.writeFloat(buffer[i * 2 + 1]);
            }
            totalBufferedAudio += sampleCount / targetRate;

            buffer = buffer.slice(sampleCount * 2, buffer.length);
        }
    }
}

