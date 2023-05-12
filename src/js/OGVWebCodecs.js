const codecMap = {
    theora: 'theora',
    vp8: 'vp8',
    vp9: 'vp09.00.10.08',
    av1: 'av01.0.01M.08',
};

function mapCodec(codec) {
    if (codecMap[codec]) {
        return codecMap[codec];
    }
    return codec;
}

export class OGVDecoderVideoWebCodecs {
    constructor(codec, options) {
        this._callbackQueue = [];
        this.videoDecoder = new VideoDecoder({
            output: (videoFrame) => {
                // Caller will be responsible for calling close()
                this.frameBuffer = {
                    videoFrame
                };
                let callback = this._callbackQueue.shift();
                callback(1);
            },
            error: (error) => {
                console.log(error);
                throw error;
            }
        });

        if (!options.videoFormat) {
            throw new Error('invalid input format');
        }
        this.loadedMetadata = true;
        this.videoFormat = options.videoFormat || null;
        this.frameBuffer = null;
        this.cpuTime = 0;
        Object.defineProperty(this, 'processing', {
            get: () => this.videoDecoder.decodeQueueSize > 0
        });

        let config = {
            codec: mapCodec(codec)
        };
        this.videoDecoder.configure(config);

        this.then = Promise.resolve(this);
    }

    static factory(codec) {
        return (options) => Promise.resolve(new OGVDecoderVideoWebCodecs(codec, options));
    }

    /**
     * Check if the codec is supported for WebCodecs decoding.
     * @param {string} codec 
     * @returns {Promise<boolean>}
     */
    static isCodecSupported(codec) {
        let config = {
            codec: mapCodec(codec)
        };
        // @todo support colorspace etc
        return VideoDecoder.isConfigSupported(config).then(
            ({supported}) => {
                console.log(`supported? ${supported}`)
                return supported
            },
            ({error}) => false
        );
    }

    init(callback) {
        callback();
    }

    processHeader(data, callback) {
        callback();
    }

    processFrame(data, callback, options={}) {
        this._callbackQueue.push(callback);
        let chunk = new EncodedVideoChunk({
            data,
            type: options.type,
            timestamp: options.timestamp,
            duration: options.duration, 
        });
        this.videoDecoder.decode(chunk)
    }

    close() {
        this.videoDecoder.close();
        this.videoDecoder = null;
    }

    sync() {
        this.videoDecoder.flush();
    }

    recycleFrame(frame) {
        frame.videoFrame.close();
    }
}
