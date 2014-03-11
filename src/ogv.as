package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    import flash.media.SoundChannel;
    
    import com.brionv.ogvlibs.CModule;
    import com.brionv.ogvlibs.OgvSwfInit;
    import com.brionv.ogvlibs.OgvSwfDestroy;
    import com.brionv.ogvlibs.OgvSwfReceiveInput;
    import com.brionv.ogvlibs.OgvSwfProcess;
    import com.brionv.ogvlibs.OgvSwfDecodeFrame;
    import com.brionv.ogvlibs.OgvSwfDecodeAudio;

    public class ogv extends Sprite {
        public var bufferSize:Number = 2048; // In samples
        public var sound:Sound = null;
        public var soundChannel:SoundChannel = null;
        public var buffer:Vector.<Number> = new Vector.<Number>();
        public var fudgeFactor:Number = 0;
        
        public function ogv() {
        	OgvSwfInit(1, 1);
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

            for each (var samp:String in s.split(" ")) {
                buffer.push(parseInt(samp, 10));
            }
        }

        public function getPlaybackState():Object {
            return {
                playbackPosition: playbackPosition(),
                samplesQueued: samplesQueued()
            };
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

