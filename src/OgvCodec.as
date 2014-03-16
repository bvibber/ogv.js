/**
 * Low-level interface wrapped around ogg/vorbis/theora libraries
 * cross-compiled with Crossbridge.
 *
 * Used by the high-level player interface.
 *
 * @author Brion Vibber <brion@pobox.com>
 * @copyright 2014
 * @license MIT-style
 */
package {
    import flash.utils.ByteArray;
    import flash.utils.IDataInput;

    import com.brionv.ogvlibs.CModule;
    import com.brionv.ogvlibs.OgvSwfInit;
    import com.brionv.ogvlibs.OgvSwfDestroy;
    import com.brionv.ogvlibs.OgvSwfReceiveInput;
    import com.brionv.ogvlibs.OgvSwfProcess;
    import com.brionv.ogvlibs.OgvSwfDecodeFrame;
    import com.brionv.ogvlibs.OgvSwfDecodeAudio;

    import com.brionv.ogvlibs.ogvSwfMetadataLoadedCallback;
    import com.brionv.ogvlibs.ogvSwfInitVideoCallback;
    import com.brionv.ogvlibs.ogvSwfOutputFrameReadyCallback;
    import com.brionv.ogvlibs.ogvSwfOutputFrameCallback;
    import com.brionv.ogvlibs.ogvSwfInitAudioCallback;
    import com.brionv.ogvlibs.ogvSwfOutputAudioReadyCallback;
    import com.brionv.ogvlibs.ogvSwfOutputAudioCallback;

    public class OgvCodec {
        private var _inputBuffer:int = 0;
        private var _inputBufferSize:int = 0;

        private var _hasAudio:Boolean = false;
        private var _audioInfo:Object = null;
        private var _audioReady:Boolean = false;
        private var _audioBuffer:Vector.<ByteArray> = null;

        private var _hasVideo:Boolean = false;
        private var _videoInfo:Object = null;
        private var _frameReady:Boolean = false;
        private var _queuedFrame:Object = null;

        // Public callbacks
        // @todo clean up this interface
        public var onmetadataloaded:Function = null;
        public var oninitvideo:Function = null;
        public var oninitaudio:Function = null;


        /**
         * Constructor: spin up a cool codec wrapper!
         *
         * options dictionary may contain boolean 'audio' and 'video' to override
         * whether to decode the streams.
         */
        public function OgvCodec(options:Object) {
            options = options || {};
            var processAudio:Boolean = (options.audio !== undefined) ? !!options.audio : true;
            var processVideo:Boolean = (options.video !== undefined) ? !!options.video : true;

            CModule.startAsync();

            // Set up the callbacks from C into our happy AS3 land
            ogvSwfMetadataLoadedCallback = metadataLoadedCallback;
            ogvSwfInitVideoCallback = initVideoCallback;
            ogvSwfOutputFrameReadyCallback = outputFrameReadyCallback;
            ogvSwfOutputFrameCallback = outputFrameCallback;
            ogvSwfInitAudioCallback = initAudioCallback;
            ogvSwfOutputAudioReadyCallback = outputAudioReadyCallback;
            ogvSwfOutputAudioCallback = outputAudioCallback;

            OgvSwfInit(processAudio ? 1 : 0, processVideo ? 1 : 0);
        }

        /**
         * Tear down the instance when done.
         *
         * todo: do we need to do something more to destroy the C environment?
         */
        public function destroy():void {
            if (_inputBuffer) {
                CModule.free(_inputBuffer);
                _inputBuffer = 0;
            }
            OgvSwfDestroy();
        }

        private function reallocInputBuffer(size:int):int {
            if (_inputBuffer && _inputBufferSize >= size) {
                // We're cool
                return _inputBuffer;
            }
            if (_inputBuffer) {
                CModule.free(_inputBuffer);
            }
            _inputBufferSize = size;
            _inputBuffer = CModule.malloc(_inputBufferSize);
            return _inputBuffer;
        }

        /**
         * Read len bytes from the given IDataInput source and feed it
         * into the ogg buffer for later processing.
         */
        public function receiveInput(byteSource:IDataInput, len:int):void {
            var buffer:int = reallocInputBuffer(len);
            CModule.writeBytes(buffer, len, byteSource);
            OgvSwfReceiveInput(buffer, len);
        }

        /**
         * Process the input buffers, looking for data packets.
         */
        public function process():Boolean {
            return !!OgvSwfProcess();
        }

        /**
         * Have we discovered an audio stream on the file?
         */
        public function get hasAudio():Boolean {
            return _hasAudio;
        }

        /**
         * Have we discovered a video stream on the file?
         */
        public function get hasVideo():Boolean {
            return _hasVideo;
        }

        /**
         * Is there an audio packet ready to decode?
         */
        public function get audioReady():Boolean {
            return _audioReady;
        }

        /**
         * Is there a video packet ready to decode?
         */
        public function get frameReady():Boolean {
            return _frameReady;
        }

        /**
         * Is there anything ready to decode?
         */
        public function get dataReady():Boolean {
            return frameReady || audioReady;
        }

        /**
         * Decode the last-found video packet
         *
         * @return boolean true if successful decode, false if failure
         */
        public function decodeFrame():Boolean {
            if (_frameReady) {
                _frameReady = false;
                return !!OgvSwfDecodeFrame();
            } else {
                throw new Error("called decodeFrame when no frame ready");
            }
        }

        /**
         * Return the last-decoded frame, if any.
         *
         * @return Object {yBytes, cbBytes, crBytes, yStride, cbStride, crStride, width, height, hdec, vdec, timestamp}
         */
        public function dequeueFrame():Object {
            if (_queuedFrame) {
                var frame:Object = _queuedFrame;
                _queuedFrame = null;
                return frame;
            } else {
                throw new Error("called dequeueFrame when no frame ready");
            }
        }

        /**
         * Decode the last-found audio packets
         *
         * @return boolean true if successful decode, false if failure
         */
        public function decodeAudio():Boolean {
            if (_audioReady) {
                _audioReady = false;
                return !!OgvSwfDecodeAudio();
            } else {
                throw new Error("called decodeAudio when no audio ready");
            }
        }

        /**
         * Return the next decoded audio buffer
         *
         * @return array of audio thingies
         */
        public function dequeueAudio():Vector.<ByteArray> {
            if (_audioBuffer) {
                var buffer:Vector.<ByteArray> = _audioBuffer;
                _audioBuffer = null;
                return buffer;
            } else {
                throw new Error("called dequeueAudio when no audio ready");
            }
        }


        // Callbacks from C!

        /**
         * Helper function to extract a buffer from the Crossbridge heap
         * into a standalone ByteArray object.
         *
         * Unfortunately there doesn't seem to be a way to get a subview
         * of the heap as a ByteArray without copying it.
         */
        private function extractBuffer(ptr:int, len:int):ByteArray {
            var out:ByteArray = new ByteArray();
            out.endian = CModule.ram.endian;
            if (len > 0) {
                CModule.readBytes(ptr, len, out);
            } else {
                // You really wanted a zero-byte buffer?
                // Well, ok. Silly Vorbis.
            }
            return out;
        }

        private function metadataLoadedCallback():void {
            if (onmetadataloaded != null) {
                onmetadataloaded();
            }
        }

        private function initVideoCallback(info:Object):void {
            _hasVideo = true;
            _videoInfo = info;
            if (oninitvideo != null) {
                oninitvideo(_videoInfo);
            }
        }

        private function outputFrameReadyCallback():void {
            _frameReady = true;
        }

        private function outputFrameCallback(bufferY:int, strideY:int,
                                             bufferCb:int, strideCb:int,
                                             bufferCr:int, strideCr:int,
                                             width:int, height:int,
                                             hdec:int, vdec:int,
                                             timestamp:Number):void 
        {
            var widthColor:int = width >> hdec,
                heightColor:int = height >> vdec,
                countBytesY:int = strideY * height,
                countBytesCb:int = strideCb * heightColor,
                countBytesCr:int = strideCr * heightColor,
                bytesY:ByteArray = extractBuffer(bufferY, countBytesY),
                bytesCb:ByteArray = extractBuffer(bufferCb, countBytesCb),
                bytesCr:ByteArray = extractBuffer(bufferCr, countBytesCr);

            // And queue up the output buffer!
            _queuedFrame = {
                bytesY: bytesY,
                bytesCb: bytesCb,
                bytesCr: bytesCr,
                strideY: strideY,
                strideCb: strideCb,
                strideCr: strideCr,
                width: width,
                height: height,
                hdec: hdec,
                vdec: vdec,
                timestamp: timestamp
            };
        }

        private function initAudioCallback(info:Object):void {
            _hasAudio = true;
            _audioInfo = info;
            if (oninitaudio != null) {
                oninitaudio(_audioInfo);
            }
        }

        private function outputAudioReadyCallback():void {
            _audioReady = true;
        }

        private function outputAudioCallback(buffers:int, channels:int, sampleCount:int):void {
            // buffers is an array of pointers to float arrays for each channel
            var outputBuffers:Vector.<ByteArray> = new Vector.<ByteArray>();
            var inPtr:int, outArray:ByteArray;
            for (var channel:int = 0; channel < channels; channel++) {
                inPtr = CModule.read32(buffers + (channel * 4));
                outArray = extractBuffer(inPtr, sampleCount * 4);
                outputBuffers.push(outArray);
            }
            _audioBuffer = outputBuffers;
        }
    }
}
