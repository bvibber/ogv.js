import {BytestreamReader, BufferQueueReader} from './BytestreamReader.js';

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

    openBox() {
        return new Box(this);
    }

    readBox() {
        const box = this.openBox();
        this.reserveRead( box.remaining );
        return box;
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
    #boxParsers
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

        this.#boxParsers = {
            ftyp: this.#ftypBox,
            mdat: this.#mdatBox,
            moov: this.#moovBox,
            mvhd: this.#mvhdBox,
        }
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
                const box = this.#readBox();
                console.log(`${box.size} ${box.type}`);

                // @fixme mdat can stream contents sensibly
                // if sample data is already available
                await this.#input.waitForData(box.remaining);

                this.#parseBox(box);

                box.advanceRemaining();
            }
        } finally {
            this.#processing = false;
        }
    }

    #readBox() {
        return new Box(this.#input);
    }

    #parseBox(box) {
        let val = null;
        if (this.#boxParsers[box.type]) {
            val = this.#boxParsers[box.type](box);
            console.log(val);
        }
        box.advanceRemaining();
        return val;
    }

    #ftypBox(box) {
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
    }

    #mdatBox(box) {
        //
    }

    #moovBox(box) {
        //
    }

    #mvhdBox(box) {
        //
    }

}
