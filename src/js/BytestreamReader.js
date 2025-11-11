import {transferArray} from './transferArray.js';

export class BytestreamReader {

    /**
     * Check if the number of bytes are available
     * @param {number} nbytes 
     * @returns boolean
     */
    available(nbytes) {
        throw new TypeError('not implemented');
    }

    /**
     * Throws on insufficient input.
     * @param {number} nbytes 
     */
    reserveRead(nbytes) {
        if (!this.available(nbytes)) {
            throw new RangeError(`Require ${nbytes} bytes, don't have it`);
        }
    }

    /**
     * Advance some number of bytes. Throws on insufficient input.
     * @param {number} nbytes 
     */
    advance(nbytes) {
        throw new TypeError('not implemented');
    }

    /**
     * Read a single byte and advance. Throws on insufficient input.
     * @returns {number}
     */
    readByte() {
        throw new TypeError('not implemented' );
    }

    /**
     * Read unsigned 8-bit number. Throws on insufficient input.
     * @return number
     */
    readUint8() {
        return this.readByte() >>> 0;
    }

    /**
     * Read signed 8-bit number. Throws on insufficient input.
     * @return number
     */
    readInt8() {
        return this.readUint8() << 24 >> 24;
    }

    /**
     * Read signed 16-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readUint16(littleEndian=false) {
        this.reserveRead(2);
        const first = this.readUint8();
        const second = this.readUint8();
        return littleEndian ?
            (first | second << 8) >>> 0 :
            (first << 8 | second) >>> 0;
    }

    /**
     * Read signed 16-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readInt16(littleEndian=false) {
        return this.readUint16(littleEndian) << 16 >> 16;
    }

    /**
     * Read unsigned 24-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readUint24(littleEndian=false) {
        this.reserveRead(3);
        let first, second;
        if (littleEndian) {
            first = this.readUint16(littleEndian);
            second = this.readUint8(littleEndian);
            return (first | second << 16) >>> 0;
        } else {
            first = this.readUint8();
            second = this.readUint16();
            return (first << 16 | second) >>> 0;
        }
    }

    /**
     * Read signed 24-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readInt24(littleEndian=false) {
        return this.readUint24(littleEndian) << 8 >> 8;
    }

    /**
     * Read unsigned 32-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readUint32(littleEndian=false) {
        this.reserveRead(4);
        const first = this.readUint16(littleEndian);
        const second = this.readUint16(littleEndian);
        return littleEndian ?
            (first | second << 16) >>> 0 :
            (first << 16 | second) >>> 0;
    }

    /**
     * Read signed 32-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian
     * @return number
     */
    readInt32(littleEndian=false) {
        return this.readUint32(littleEndian) | 0;
    }

    /**
     * Read unsigned 64-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian 
     * @returns BigInt
     */
    readBigUint64(littleEndian=false) {
        this.reserveRead(8);
        const first = BigInt(this.readUint32(littleEndian));
        const second = BigInt(this.readUint32(littleEndian));
        return littleEndian ?
            (first | second << 32n) :
            (first << 32n | second);
    }

    /**
     * Read signed 64-bit number. Throws on insufficient input.
     * @param {boolean} littleEndian 
     * @returns 
     */
    readBigInt64(littleEndian=false) {
        const val = this.readBigUint64(littleEndian);
        if (val > 0x8000000000000000n) {
            return val - 0x10000000000000000n;
        }
        return val;
    }

    /**
     * Read a sequence of bytes. Throws on insufficient input.
     * @param {number} nbytes 
     * @returns Uint8Array
     */
    readBytes(nbytes) {
        this.reserveRead(nbytes);
        const dest = new Uint8Array(nbytes);
        for (let i = 0; i < nbytes; i++) {
            dest[i] = this.readUint8();
        }
        return dest;
    }

    /**
     * Read ASCII string of given length. Throws on insufficient input.
     * @param {number} nbytes 
     * @returns string
     */
    readASCII(nbytes) {
        this.reserveRead(nbytes);
        const bytes = [];
        while (nbytes--) {
            bytes.push(this.readUint8());
        }
        return String.fromCharCode(...bytes);
    }
}

export class Cancellation extends Error {

}

export class BufferQueueReader extends BytestreamReader {
    /** @type {Uint8Array|null} */
    #buffer

    /** @type {DataView|null} */
    #view

    /** @type {number} */
    #pos

    /** @type {Uint8Array[]} */
    #queue

    /** @type {object|null} */
    #waiting

    constructor() {
        super();
        this.#buffer = null;
        this.#view = null;
        this.#pos = 0;
        this.#queue = [];
        this.#waiting = null;
    }

    /**
     * Clear out the input state
     */
    flush() {
        this.#buffer = null;
        this.#view = null;
        this.#pos = 0;
        this.#queue.splice(0, this.#queue.length);
        if (this.#waiting) {
            this.cancel();
        }
    }

    waitForData(nbytes) {
        return new Promise((resolve, reject) => {
            if (this.#waiting) {
                throw new Error("Invalid state? Asked to wait while waiting.");
            }
            if (this.available(nbytes)) {
                resolve();
            } else {
                this.#waiting = {
                    nbytes: nbytes,
                    resolve,
                    reject
                };
            }
        });
    }

    cancel(err=new Cancellation()) {
        if (this.#waiting) {
            const reject = this.#waiting.reject;
            this.#waiting = null;
            reject(err);
        }
    }

    /**
     * @param {Uint8Array} data 
     * @param {ArrayBuffer[]} transfer 
     */
    appendData(data, transfer=[]) {
        this.#queue.push(transferArray(data, transfer));
        if (!this.#buffer) {
            this.#buffer = this.#queue.shift();
            this.#view = new DataView(
                this.#buffer.buffer,
                this.#buffer.byteOffset,
                this.#buffer.byteLength
            );
            this.#pos = 0;
        }
        if (this.#waiting) {
            const {nbytes, resolve} = this.#waiting;
            if (this.available(nbytes)) {
                this.#waiting = null;
                resolve();
            }
        }
    }

    /** @inheritdoc */
    available(nbytes) {
        if (nbytes === 0) {
            return true;
        }
        if (!this.#buffer) {
            return false;
        }
        let available = this.#buffer.length - this.#pos;
        if (available >= nbytes) {
            return true;
        }
        for (const buffer of this.#queue) {
            available += buffer.length;
            if (available >= nbytes) {
                return true;
            }
        }
        return false;
    }

    /** @inheritdoc */
    advance(nbytes) {
        if (nbytes === 0) {
            return;
        }
        this.#pos += nbytes;
        while (this.#buffer && this.#pos >= this.#buffer.length) {
            this.#pos -= this.#buffer.length;
            this.#buffer = this.#queue.shift() || null;
            if (this.#buffer) {
                this.#view = new DataView(
                    this.#buffer.buffer,
                    this.#buffer.byteOffset,
                    this.#buffer.byteLength
                );
            } else {
                this.#view = null;
            }
            if (this.#pos < 0) {
                throw new Error('Invalid state');
            }
        }
        if (!this.#buffer && this.#pos > 0) {
            throw new RangeError(`Don't have ${nbytes}`);
        }
    }

    /** @inheritdoc */
    readByte() {
        this.reserveRead(1);
        const n = this.#buffer[this.#pos] >>> 0;
        //const n = this.#view.getUint8(this.#pos);
        this.advance(1);
        return n;
    }

    /** @inheritdoc */
    readUint16(littleEndian=false) {
        this.reserveRead(2);
        if (this.#buffer.length - this.#pos >= 2) {
            const n = this.#view.getUint16(this.#pos, littleEndian);
            this.advance(2);
            return n;
        } else {
            return super.readUint16(littleEndian);
        }
    }

    /** @inheritdoc */
    readUint32(littleEndian=false) {
        this.reserveRead(4);
        if (this.#buffer.length - this.#pos >= 4) {
            const n = this.#view.getUint32(this.#pos, littleEndian);
            this.advance(4);
            return n;
        } else {
            return super.readUint32(littleEndian);
        }
    }

    /** @inheritdoc */
    readBigUint64(littleEndian=false) {
        this.reserveRead(8);
        if (this.#buffer.length - this.#pos >= 8) {
            const n = this.#view.getBigUint64(this.#pos, littleEndian);
            this.advance(8);
            return n;
        } else {
            return super.readBigUint64(littleEndian);
        }
    }

    /** @inheritdoc */
    readBytes(nbytes) {
        this.reserveRead(nbytes);
        const dest = new Uint8Array(nbytes);
        let i = 0;
        while (i < nbytes) {
            const remainingInBuffer = this.#buffer.length - this.#pos;
            const readLength = Math.min(nbytes, remainingInBuffer);
            if (!readLength) {
                throw new Error(`Short read, ${nbytes} remaining unavailble`);
            }
            dest.set(this.#buffer.slice(this.#pos, readLength), i);
            this.advance(readLength);
            i += readLength;
        }
        return dest;
    }

}
