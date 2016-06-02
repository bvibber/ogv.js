package {
    import flash.utils.IDataOutput;

    /**
     * Linked list item for queued audio buffers
     *
     * Buffers are 16-bit signed int per sample, in ASCII hex, for 2 channels
     */
    internal class BufferQueueItem implements ILogger {
        public var prev:BufferQueueItem;
        public var next:BufferQueueItem;
        private var str:String;
        private var logger:ILogger;

        static private const bytesPerSample:int = 8;
        static private const multiplier:Number = 1/16384; // smaller than 32768 to allow some headroom from those floats;
        static private var _hexValues:Vector.<int>;

        public function BufferQueueItem(hexString:String, aLogger:ILogger=null) {
            str = hexString;
            prev = null;
            next = null;
            logger = aLogger;
        }

        public function sampleCount():int {
            return str.length / bytesPerSample;
        }

        public function splitAt(sample:int, callback:Function):void {
            callback(new BufferQueueItem(str.slice(0, sample * bytesPerSample), logger),
                     new BufferQueueItem(str.slice(sample * bytesPerSample), logger));
        }

        private function hexValuesMap():Vector.<int> {
            if (!_hexValues) {
                _hexValues = new Vector.<int>(256);
                // Create a hex digit lookup table
                var hexDigits:Array = ['0', '1', '2', '3', '4', '5', '6', '7',
                                       '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
                for (var i:int = 0; i < hexDigits.length; i++) {
                    _hexValues[hexDigits[i].charCodeAt(0)] = i;
                }
            }
            return _hexValues;
        }

        public function writeToOutput(out:IDataOutput, volume:Number):void {
            var hexValues:Vector.<int> = hexValuesMap();
            for (var i:int = 0; i < str.length; i += 4) {
                var sample:int = (hexValues[str.charCodeAt(i)]) |
                                 (hexValues[str.charCodeAt(i + 1)] << 4) |
                                 (hexValues[str.charCodeAt(i + 2)] << 8) |
                                 (hexValues[str.charCodeAt(i + 3)] << 12);
                // sign extension to 32 bits via arithmetic shift
                sample = (sample << 16) >> 16;
                out.writeFloat(sample * multiplier * volume);
            }
        }

        public function log(msg:String):void {
            if (logger) {
                logger.log(msg);
            }
        }

    }
}
