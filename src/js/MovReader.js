import {BytestreamReader, BufferQueueReader} from './BytestreamReader.js';

const maxUint32 = 0xffffff;
const maxBigUint64 = 0xffffffffffffffffn;
const maxSafeBigInt = BigInt(Number.MAX_SAFE_INTEGER);

// Heavily inspired by ffmpeg's libavformat mov.c
const boxParsers = {
    ftyp(box) {
        const ftyp = {
            major: box.readASCII(4),
            minor: box.readUint32(),
            compatibleBrands: [],
        };
        const nbrands = box.remaining >> 2;
        for (let i = 0; i < nbrands; i++) {
            ftyp.compatibleBrands.push(box.readASCII(4));
        }
        return ftyp;
    },

    moov(box) {
        return box.readRemainingBoxes();
    },

    mdat(box) {
        return box.readRemainingBytes();
    },

    mvhd(box) {
        const version = box.readUint8();
        const flags = box.readUint24();
        if (version === 1) {
            // creation time
            box.readBigInt64();
            // modification time
            box.readBigInt64();
        } else {
            // creation time
            box.readInt32();
            // modification time
            box.readInt32();
        }
        const timeScale = box.readInt32();
        if (timeScale <= 0) {
            throw new RangeError("Invalid time scale");
        }

        let duration;
        if (version === 1) {
            duration = box.readBigUint64();
            if (duration >= maxSafeBigInt) {
                // Working with time in seconds is easier if we use
                // JavaScript numbers.
                throw new RangeError('Duration does not fit in double');
            }
            duration = Number(duration);
        } else {
            duration = box.readUint32();
        }

        // remaining fields not yet used

        return {
            version,
            flags,
            timeScale,
            duration
        }
    }
};

function parseBox(box) {
    const parser = boxParsers[box.type];
    let result = null;
    if (parser) {
        result = parser(box);
    }
    box.advanceRemaining();
    return result;
}

export class Box extends BytestreamReader {
    #input
    #pos

    /**
     * Read the size/type header of a mov box from the input
     * and encapsulate reading within it.
     *
     * @param {BytestreamReader} input
     */
    constructor(input) {
        super();
        input.reserveRead(8);
        this.size = input.readUint32();
        this.type = input.readASCII(4);
        this.#input = input;
        this.#pos = 8;
    }

    /**
     * Remaining bytes in the box, regardless
     * of whether they are available to read yet.
     * @returns {number}
     */
    get remaining() {
        return this.size - this.#pos;
    }

    /** @inheritdoc */
    advance(nbytes) {
        this.reserveRead(nbytes);
        this.#input.advance(nbytes);
        this.#pos += nbytes;
    }

    /**
     * Advance input to the end of the box.
     */
    advanceRemaining() {
        this.advance(this.remaining);
    }

    /** @inheritdoc */
    available(nbytes) {
        return nbytes <= this.remaining && this.#input.available(nbytes);
    }

    /** @inheritdoc */
    readUint8() {
        this.reserveRead(1);
        const val = this.#input.readUint8();
        this.#pos++;
        return val;
    }

    /**
     * Read the read of the box into a byte array.
     * @param {number} nbytes
     * @returns {Uint8Array}
     */
    readRemainingBytes() {
        return this.readBytes(this.remaining);
    }

    readBox() {
        const box = new Box(this);
        return {
            type: box.type,
            size: box.size,
            data: parseBox(box)
        };
    }

    /**
     * Read and parse any remaining boxes into an array.
     * @returns {Object[]}
     */
    readRemainingBoxes() {
        const results = [];
        while (this.available(8)) {
            results.push(this.readBox());
        }
        return results;
    }
}

export class MovReader {
    // Output callbacks
    #mediaFormat
    #videoFormat
    #audioFormat
    #videoChunk
    #audioChunk
    #keyframeIndex
    #keyframeIndexOffset

    // Internal state
    #input
    #processing

    constructor(options={}) {
        const stub = () => {};
        this.#mediaFormat = options.mediaFormat || stub;
        this.#videoFormat = options.videoFormat || stub;
        this.#audioFormat = options.audioFormat || stub;
        this.#videoChunk = options.videoChunk || stub;
        this.#audioChunk = options.audioChunk || stub;
        this.#keyframeIndex = options.keyframeIndex || stub;
        this.#keyframeIndexOffset = options.keyframeIndexOffset || stub;

        this.#input = new BufferQueueReader();
        this.#processing = false;
    }

    /**
     * @param {Uint8Array} data
     * @param {ArrayBuffer[]} transfer
     */
    appendData(data, transfer) {
        this.#input.appendData(data, transfer);
        if (!this.#processing) {
            this.processData();
        }
    }

    async processData(data, transfer) {
        if (this.#processing) {
            throw new Error('Invalid state, trying to restart parsing while waiting for input');
        }
        try {
            this.#processing = true;
            while (true) {
                if (!this.#input.available(1)) {
                    // End of current input. Clear out.
                    return true;
                }

                // Need enough for a box header.
                await this.#input.waitForData(8);
                const box = this.#openBox();
                console.log(`${box.size} ${box.type}`);

                // @fixme mdat can stream contents sensibly
                // if sample data is already available
                await this.#input.waitForData(box.remaining);

                let parsed = parseBox(box);
                console.log(JSON.stringify(parsed));

                box.advanceRemaining();
            }
        } finally {
            this.#processing = false;
        }
    }

    #openBox() {
        return new Box(this.#input);
    }

}
