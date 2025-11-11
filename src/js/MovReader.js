import {BytestreamReader, BufferQueueReader} from './BytestreamReader.js';

const maxUint32 = 0xffffff;
const maxBigUint64 = 0xffffffffffffffffn;
const maxSafeBigInt = BigInt(Number.MAX_SAFE_INTEGER);
const minSafeBigInt = BigInt(-Number.MAX_SAFE_INTEGER);

const primaryStrings = [
	null, // reserved
	'bt709',
	'unknown',
	null, // reserved
	null, // bt470m
	'bt470bg',
	'smpte170m',
	null, // smpte240m
	null, // film
	'bt2020',
	null, // smpte428
	null, // smpte431
	null, // smpte432
	null, // ebu3213
];

const transferStrings = [
	null, // reserved
	'bt709',
	null, // unknown
	null, // reserved
	null, // bt470m
	null, // bt470bg
	'smpte170m',
	null, // smpte240m
	'linear',
	null, // log100
	null, // log316
	null, // iec61966-2-4
	null, // bt1361e
	'iec61966-2-1', // sRGBA
	'bt2020', // bt2020-10
	'bt2020', // bt2020-12
	'pq', // smpte2084
	null, // smpte428
	'hlg', // arib-std-b67
];

const matrixStrings = [
	'rgb', // gbr ?
	'bt709',
	null, // unknown
	null, // reserved
	null, // fcc
	'bt470bg',
	'smpte170m',
	null, // smpte240m
	null, // ycgco
	'bt2020-ncl', // bt2020nc
	'bt2020-ncl', // bt2020c
	null, // smpte2085
	null, // chroma-derived-nc
	null, // chroma-derived-c
	null, // ictcp
	null, // ipt-c2
	null, // ycgco-re
	null, // ycgco-ro
];

// Heavily inspired by ffmpeg's libavformat mov.c
function recurse(box) {
	return {
		boxes: box.readRemainingBoxes()
	};
};

function parseVideo(box) {
	box.readUint32(); // reserved
	box.readUint16(); // reserved
	const dref = box.readUint16();

	const version = box.readUint16();
	const revision = box.readUint16();
	const vendor = box.readASCII(4); // vendor
	box.readUint32(); // temporal quality
	box.readUint32(); // spatial quality
	const width = box.readUint16();
	const height = box.readUint16();
	box.readUint32(); // h res
	box.readUint32(); // v res
	box.readUint32(); // data size?
	box.readUint16(); // frames per sample

	// Compressor is a 32-byte buffer with a "Pascal"-style string,
	// starting with a length byte, and _not_ null terminated.
	const len = box.readUint8();
	if (len > 31) {
		len = 31;
	}
	const compressor = box.readASCII(len);
	box.advance(31 - len);

	let depth = box.readUint16();
	const grayscale = !!(depth & 0x20);
	depth &= 0x1f;
	if (depth < 24) {
		throw new Error('Unsupported bit depth');
	}

	const colorTable = box.readUint16();
	if (colorTable === 0) {
		throw new Error('Unsupported palette');
	}

	const boxes = box.readRemainingBoxes();
	return {
		dref,
		version,
		vendor,
		revision,
		width,
		height,
		compressor,
		depth,
		grayscale,
		colorTable,
		boxes
	};
}

function parseExtraData(box) {
	return {
		extraData: box.readRemainingBytes()
	};
}

const boxParsers = {
	ftyp(box) {
		const major = box.readASCII(4);
		const minor = box.readUint32();
		const compatibleBrands = [];

		while (box.remaining >= 4) {
			compatibleBrands.push(box.readASCII(4));
		}

		return {
			major,
			minor,
			compatibleBrands
		};
	},

	moov: recurse,

	mdat(box) {
		return {
			data: box.readRemainingBytes()
		};
	},

	mvhd(box) {
		const version = box.readUint8();
		if (version > 1) {
			throw new RangeError("Unsupported mvhd version");
		}
		const flags = box.readUint24();

		box.readInt32Or64(version); // creation time
		box.readInt32Or64(version); // modification time

		const timeScale = box.readInt32();
		if (timeScale <= 0) {
			throw new RangeError("Invalid time scale");
		}

		const duration = box.readInt32Or64(version);
		if (duration < 0) {
			throw new RangeError("Invalid time scale");
		}

		// remaining fields not yet used

		return {
			version,
			flags,
			timeScale,
			duration
		}
	},

	trak: recurse,

	tkhd(box) {
		const version = box.readUint8();
		if (version > 1) {
			throw new RangeError("Unsupported tkhd version");
		}
		const flags = box.readUint24();

		box.readInt32Or64(version); // creation time
		box.readInt32Or64(version); // modification time

		const id = box.readUint32();

		box.readUint32(); // reserved

		const duration = box.readInt32Or64(version);

		box.readUint32(); // reserved
		box.readUint32(); // reserved

		box.readUint16(); // layer
		box.readUint16(); // alternate group
		box.readUint16(); // volume
		box.readUint16(); // reserved

		// display matrix
		box.advance(4 * 9);

		// Fixed-point 16.16, we only want integers
		const width = box.readUint32() >> 16;
		const height = box.readUint32() >> 16;

		return {
			version,
			flags,
			id,
			duration,
			width,
			height
		}
	},

	mdia: recurse,

	mdhd(box) {
		const version = box.readUint8();
		if (version > 1) {
			throw new RangeError("Unsupported mdhd version");
		}
		const flags = box.readUint24();

		// Creation time
		box.readInt32Or64(version);

		let timeScale = box.readInt32();
		if (timeScale <= 0) {
			timeScale = 1;
		}
		
		const duration = box.readInt32Or64(version);

		// language
		box.readUint16();

		return {
			version,
			flags,
			timeScale,
			duration
		};
	},

	minf: recurse,

	stbl: recurse,

	stsd(box) {
		const version = box.readUint8();
		const flags = box.readUint24();
		const entries = box.readInt32();
		if (entries <= 0 || entries > box.remaining / 8) {
			throw new Error("Invalid stsd entries");
		}
		const sampleDescriptions = [];
		for (let i = 0; i < entries; i++) {
			sampleDescriptions.push(box.readBox());
		}
		const boxes = box.readRemainingBoxes();
		return {
			version,
			flags,
			sampleDescriptions,
			boxes
		};
	},

	avc1: parseVideo,

	avcC: parseExtraData,

	colr(box) {
		const type = box.readASCII(4);
		if (type === 'prof') {
			throw new Error('embedded ICC profile');
		}
		if (type !== 'nclx' && type !== 'nclc') {
			throw new Error(`Unknown profile type ${type}`);
		}
		const primaries = primaryStrings[box.readUint16()] || null;
		const transfer = transferStrings[box.readUint16()] || null;
		const matrix = transferStrings[box.readUint16()] || null;
		let fullRange = null;
		if (type === 'nclx') {
			fullRange = !!(box.readUint8() >> 7);
		}
		return {
			primaries,
			transfer,
			matrix,
			fullRange,
		};
	},

	stts(box) {
		box.readUint8(); // version
		box.readUint24(); // flags

		const entries = box.readUint32();

		const sampleCounts = new Uint32Array(entries);
		const sampleDurations = new Uint32Array(entries);
		let totalSamples = 0;
		let totalDuration = 0;

		for (let i = 0; i < entries; i++) {
			const count = box.readUint32();
			const duration = box.readUint32();

			// ffmpeg warns of negative offsets stored for dts offsets sometimes
			// if this comes up explode later
			//
			// ffmpeg also warns of invalid durations of 0 which can break

			sampleCounts[i] = count;
			sampleDurations[i] = duration;

			totalSamples += count;
			totalDuration += duration * count;
		}
		return {
			totalSamples,
			totalDuration,
			sampleCounts,
			sampleDurations,
			totalSamples,
			totalDuration,
		};
	},
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
		if (this.size < 8) {
			throw new Error('Invalid too-small box');
		}
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
		const result = Object.assign({
			type: box.type,
			size: box.size,
		}, parseBox(box));
		box.advanceRemaining();
		return result;
	}

	/**
	 * Read and parse any remaining boxes into an array.
	 * @returns {Object[]}
	 */
	readRemainingBoxes() {
		const results = [];
		while (this.remaining >= 8) {
			const result = this.readBox();
			results.push(result);
		}
		return results;
	}

	/**
	 * Read either a 32- or 64-bit integer and return it
	 * as a JS number (throws if doesn't fit in 53 bits).
	 *
	 * @param {number} version non-zero reads 64-bit
	 * @param {boolean} littleEndian
	 * @returns 
	 */
	readInt32Or64(version, littleEndian=false) {
		if (version >= 1) {
			const n = this.readUint64(littleEndian);
			if (n > maxSafeBigInt || n < minSafeBigInt) {
				throw new Error("Failed to fit 64-bit number in 53 bits.");
			}
			return Number(n);
		}
		return this.readInt32(littleEndian);
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

				if (box.type === 'mdat') {
					console.log('it is the mdat');
				} else {
					let parsed = parseBox(box);
					console.log(JSON.stringify(parsed, null, 4));
				}

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
