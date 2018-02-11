package {
    import flash.utils.ByteArray;
    import flash.utils.Endian;
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

        static private const bytesPerSample:int = 16;
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

        public function writeToOutput(out:IDataOutput):void {
            var hexValues:Vector.<int> = hexValuesMap();
            var bytes:ByteArray = new ByteArray();
            bytes.endian = Endian.LITTLE_ENDIAN;

            // Convert hex string to byte array...
            var i:int;
            for (i = 0; i < str.length; i += 2) {
                var byte:int = (hexValues[str.charCodeAt(i)] << 4) |
                               (hexValues[str.charCodeAt(i + 1)]);
                bytes.writeByte((byte << 24) >> 24);
            }

            // Read them as native-endian float32s and write to output;
            // note out.writeBytes(bytes) doesn't work.
            bytes.position = 0;
            for (i = 0; i < str.length; i += 8) {
              out.writeFloat(bytes.readFloat());
            }
        }

        public function log(msg:String):void {
            if (logger) {
                logger.log(msg);
            }
        }

    }
}
