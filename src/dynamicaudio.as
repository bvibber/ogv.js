package {
    import flash.display.Sprite;
    import flash.events.SampleDataEvent;
    import flash.external.ExternalInterface;
    import flash.media.Sound;
    
    public class dynamicaudio extends Sprite {
        public var bufferSize:Number = 2048; // In samples
        public var sound:Sound = null;
        public var buffer:Array = [];
        
        public function dynamicaudio() {
            ExternalInterface.addCallback('write',  write);
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
                this.sound.play();
            }
            
            var multiplier:Number = 1/32768;
            for each (var sample:String in s.split(" ")) {
                this.buffer.push(Number(sample)*multiplier);
            }
        }

        public function soundGenerator(event:SampleDataEvent):void {
            var i:int;
            
            // If we haven't got enough data, write 2048 samples of silence to 
            // both channels, the minimum Flash allows
            if (this.buffer.length < this.bufferSize*2) {
                for (i = 0; i < 4096; i++) {
                    event.data.writeFloat(0.0);
                }
                return;
            }
            
            var count:Number = Math.min(this.buffer.length, 16384);
            
            for each (var sample:Number in this.buffer.slice(0, count)) {
                event.data.writeFloat(sample);
            }
            
            this.buffer = this.buffer.slice(count, this.buffer.length);
        }
    }
}

