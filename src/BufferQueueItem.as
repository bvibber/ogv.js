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
        private var start:int;
        private var len:int;
        private var logger:ILogger;

        static private const charsPerSample:int = 8;

        public function BufferQueueItem(binString:String, _start:int, _len:int, aLogger:ILogger=null) {
            str = binString;
            start = _start;
            len = _len;
            prev = null;
            next = null;
            logger = aLogger;
        }

        public function sampleCount():int {
            return len / charsPerSample;
        }

        public function splitAt(sample:int, callback:Function):void {
            var mid:int = sample * charsPerSample;
            callback(new BufferQueueItem(str, start, mid, logger),
                     new BufferQueueItem(str, start + mid, len - mid, logger));
        }

        public function writeToOutput(out:IDataOutput):void {
            var bytes:ByteArray = new ByteArray();
            bytes.endian = Endian.LITTLE_ENDIAN;

            // Convert binary string to byte array...
            var i:int;
            var end:int = start + len;
            for (i = start; i < end; i++) {
                // remove the private use area offset
                var byte:int = str.charCodeAt(i) & 0xff;
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
