package {
    import flash.utils.ByteArray;
    import flash.utils.Endian;
    import flash.utils.IDataOutput;

    /**
     * Linked list item for queued audio buffers
     *
     * Buffers are 32-bit float per sample, in binary string, for 2 channels
     * binary string is offset into U+E000 private use area
     */
    internal class BufferQueueItem implements ILogger {
        public var prev:BufferQueueItem;
        public var next:BufferQueueItem;
        private var str:String;
        private var logger:ILogger;

        static private const charsPerSample:int = 8;

        public function BufferQueueItem(binString:String, aLogger:ILogger=null) {
            str = binString;
            prev = null;
            next = null;
            logger = aLogger;
        }

        public function sampleCount():int {
            return str.length / charsPerSample;
        }

        public function splitAt(sample:int, callback:Function):void {
            callback(new BufferQueueItem(str.slice(0, sample * charsPerSample), logger),
                     new BufferQueueItem(str.slice(sample * charsPerSample), logger));
        }

        public function writeToOutput(out:IDataOutput):void {
            var bytes:ByteArray = new ByteArray();
            bytes.endian = Endian.LITTLE_ENDIAN;

            // Convert binary string to byte array...
            var i:int;
            for (i = 0; i < str.length; i++) {
                // remove the private use area offset
                var byte:int = str.charCodeAt(i) - 0xe000;
                bytes.writeByte(byte);
            }

            // Read them as native-endian float32s and write to output;
            // note out.writeBytes(bytes) doesn't work.
            bytes.position = 0;
            for (i = 0; i < bytes.length; i += 8) {
              out.writeFloat(bytes.readFloat());
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
