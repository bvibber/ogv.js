//import {MatroskaReader} from './MatroskaReader.js';
import {MovReader} from './MovReader.js';
//import {MpegReader} from './MpegReader.js';
//import {OggReader} from './OggReader.js';

const majorMimes = {
	application: true,
	audio: true,
	video: true
};

const readerForMinor = {
	//matroska: MatroskaReader,
	//webm: MatroskaReader,

	//mpeg: MpegReader,

	'3gpp': MovReader,
	mp4: MovReader,
	quicktime: MovReader,

	//ogg: OggReader
};

function readerForConfig(config) {
	const type = config.type;
	const [base] = type.split(';');
	let [major, minor] = base.split('/');
	major = major.toLower();
	minor = minor.toLower();
	if (!majorMimes[major]) {
		return null;
	}
	return readerForMinor[minor];
}


export class MediaDemuxer {
	// External state
	#state

	// Internal state
	#type
	#reader

	// Output callbacks
	#mediaFormat
	#videoFormat
	#audioFormat
	#videoChunk
	#audioChunk
	#keyframeIndex
	#keyframeIndexOffset

	constructor(options={}) {
		Object.defineProperties(this, {
			state: {
				get: () => {
					return this.#state;
				}
			}
		});

		this.#state = "unconfigured";
		this.#type = null;
		this.#reader = null;

		const stub = () => {};
		this.#mediaFormat = options.mediaFormat || stub;
		this.#videoFormat = options.videoFormat || stub;
		this.#audioFormat = options.audioFormat || stub;
		this.#videoChunk = options.videoChunk || stub;
		this.#audioChunk = options.audioChunk || stub;
		this.#keyframeIndex = options.keyframeIndex || stub;
		this.#keyframeIndexOffset = options.keyframeIndexOffset || stub;
	}

	static isConfigSupported(config) {
		return !!readerForConfig(config);
	}

	configure(config) {
		if (this.#state !== 'unconfigured') {
			throw new DOMException(`Invalid state ${this.#state}`, 'InvalidStateError');
		}
		const reader = readerForConfig(config);
		if (reader) {
			this.#type = config.type;
			this.#reader = new handler({
				type: config.type,
				mediaFormat: this.#mediaFormat,
				videoFormat: this.#videoFormat,
				audioFormat: this.#audioFormat,
				videoChunk: this.#videoChunk,
				audioChunk: this.#audioChunk,
				keyframeIndex: this.#keyframeIndex,
				keyframeIndexOffset: this.#keyframeIndexOffset
			});
			this.#state = "configured";
		} else {
			throw new RangeError('unsupported configuration');
		}
	}

	flush() {
		if (this.#state !== 'configured') {
			throw new DOMException(`Invalid state ${this.#state}`, 'InvalidStateError');
		}
		this.#reader.flush();
	}

	close() {
		this.#type = null;
		this.#reader = null;
		this.#state = "closed";
	}

	reset() {
		this.#type = null;
		this.#reader = null;
		this.#state = "unconfigured";
	}

	/**
	 * Append data to the input buffer and process it.
	 * Events may trigger output callbacks for format
	 * data, packets etc.
	 *
	 * @param {BufferProvider} data 
	 * @param {BufferProvider[]} transfer
	 * @return {number} number of bytes processed (may be less than provided if data is incomplete)
	 */
	processData(data, transfer=[]) {
		if (this.#state !== 'configured') {
			throw new DOMException(`Invalid state ${this.#state}`, 'InvalidStateError');
		}
		return this.handler.processData(data, transfer);
	}
}
