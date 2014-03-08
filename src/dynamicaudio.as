package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    
    public class dynamicaudio extends Sprite {
        public var bufferSize:Number = 2048; // In samples
        public var sound:Sound = null;
        public var soundChannel:SoundChannel = null;
        public var stringBuffer:Vector.<String> = new Vector.<String>();
        public var buffer:Vector.<Number> = new Vector.<Number>();
        public var fudgeFactor:Number = 0;
        public var multiplier:Number = 1/32768;
        
        public function dynamicaudio() {
            ExternalInterface.addCallback('write',  write);
            ExternalInterface.addCallback('playbackPosition', playbackPosition);
            ExternalInterface.addCallback('samplesQueued', samplesQueued);
        }
        
        // Called from JavaScript to add samples to the buffer
        // Note we are using a space separated string of samples instead of an 
        // array. Flash's stupid ExternalInterface passes every sample as XML, 
        // which is incredibly expensive to encode/decode
        public function write(s:String):void {
            if (!this.sound) {
                this.sound = new Sound(); 
                this.sound.addEventListener(
                    SampleDataEvent.SAMPLE_DATA,
                    soundGenerator
                );
                this.soundChannel = this.sound.play();
            }
            stringBuffer.push(s);
        }

        public function samplesQueued():Number {
        	return buffer.length / 2;
        }
        
        public function playbackPosition():Number {
        	if (this.soundChannel == null) {
        		return 0;
        	} else {
        		return this.soundChannel.position / 1000 - this.fudgeFactor;
        	}
        }

        public function soundGenerator(event:SampleDataEvent):void {
            var i:int;

            // Note: Flash's threading model *seems* to keep this from being
            // a race condition with the write() external callback. We *think*
            // the write() call will block until this callback is done, or something.
            while (stringBuffer.length > 0) {
                var s:String = stringBuffer.shift();
                for each (var samp:String in s.split(" ")) {
                    buffer.push(parseInt(samp, 10) * multiplier);
                }
            }
            
            // If we haven't got enough data, write 2048 samples of silence to 
            // both channels, the minimum Flash allows
            if (buffer.length < bufferSize*2) {
                for (i = 0; i < 4096; i++) {
                    event.data.writeFloat(0.0);
                }
                this.fudgeFactor += (2048 / 44100);
                return;
            }
            
            var count:Number = Math.min(buffer.length, 16384);
            
            for (i = 0; i < count; i++) {
                event.data.writeFloat(buffer[i]);
            }
            
            buffer = buffer.slice(count, buffer.length);
        }
    }
}

