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
                let format = {
                    width: videoFrame.codedWidth,
                    height: videoFrame.codedHeight,
                    chromaWidth: videoFrame.codedWidth,
                    chromaHeight: videoFrame.codedHeight,
                    cropLeft: videoFrame.visibleRect.x,
                    cropTop: videoFrame.visibleRect.y,
                    cropWidth: videoFrame.visibleRect.width,
                    cropHeight: videoFrame.visibleRect.height,
                    displayWidth: videoFrame.displayWidth,
                    displayHeight: videoFrame.displayHeight
                };
                if (videoFrame.format === 'I420') {
                    format.chromaWidth = format.width >> 1;
                    format.chromaHeight = format.height >> 1;
                }
                if (videoFrame.format === 'I422') {
                    format.chromaWidth = format.width >> 1;
                }
                if (videoFrame.format === 'NV12') {
                    throw new Error('NV12 not yet supported');
                }
                let options = {
                    rect: {
                        x: 0,
                        y: 0,
                        width: format.width,
                        height: format.height
                    }
                };
                let size = videoFrame.allocationSize(options);
                let buffer = new ArrayBuffer(size);
                let plane = (layout, height) => {
                    return {
                        stride: layout.stride,
                        bytes: new Uint8Array(buffer, layout.offset, layout.stride * height)
                    }
                };
                videoFrame.copyTo(buffer, options).then((layout) => {
                    this.frameBuffer = {
                        format,
                        y: plane(layout[0], format.height),
                        u: plane(layout[1], format.chromaHeight),
                        v: plane(layout[2], format.chromaHeight),
                    };
                    videoFrame.close();
                    let callback = this._callbackQueue.shift();
                    callback(1);
                });
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
        //
    }
}
