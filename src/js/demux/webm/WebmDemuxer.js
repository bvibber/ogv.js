'use strict';

var DataInterface = require('./DataInterface.js');
var SeekHead = require('./SeekHead.js');
var SegmentInfo = require('./SegmentInfo.js');
var Tracks = require('./Tracks.js');


//States
const INITIAL_STATE = 0;
const HEADER_LOADED = 1;
const SEGMENT_LOADED = 2;
const META_LOADED = 3;
const NO_MARKER = -1;
const EXIT_OK = 666;


class OGVDemuxerWebM {

    constructor() {
        this.shown = false; // for testin
        this.bufferQueue = [];
        this.segmentInfo = [];
        this.state = INITIAL_STATE;
        this.videoPackets = [];
        this.audioPackets = [];
        this.loadedMetadata = false;
        this.seekable = false;
        this.dataInterface = new DataInterface();
        this.segment = null;
        this.currentElement = null; // placeholder for last element
        this.segmentIsLoaded = false; // have we found the segment position
        //this.segmentOffset;
        this.segmentDataOffset;
        this.headerIsLoaded = false;
        this.currentElement = null;
        this.markerIsSet = false;
        this.marker = NO_MARKER;
        this.segmentInfo = null; // assuming 1 for now
        this.tracks = null;

        //Only need this property cause nest egg has it

        Object.defineProperty(this, 'videoCodec', {

            get: function () {
                var codecID;
                //Multiple video tracks are allowed, for now just return the first one
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry instanceof VideoTrack) {
                        codecID = trackEntry.info.codecID;
                        break;
                    }


                }
                var codecName;
                switch (codecID) {
                    case "V_VP8" :
                        codecName = "vp8";
                        break;
                    default:
                        codecName = null;
                        break;
                }
                ;

                return codecName;

            }
        });


        Object.defineProperty(this, 'audioCodec', {

            get: function () {
                var codecID;
                //Multiple video tracks are allowed, for now just return the first one
                for (var i in this.tracks.trackEntries) {
                    var trackEntry = this.tracks.trackEntries[i];
                    if (trackEntry instanceof AudioTrack) {
                        codecID = trackEntry.info.codecID;
                        break;
                    }


                }
                var codecName;
                switch (codecID) {
                    case "A_VORBIS" :
                        codecName = "vorbis";
                        break;
                    default:
                        codecName = null;
                        break;
                }
                ;

                return codecName;

            }
        });
    }

    init(callback) {
        console.warn("initializing demuxer webm");
        callback();
    }

    receiveInput(data, callback) {

        //this.bufferQueue.push(new DataView(data));
        this.dataInterface.recieveInput(data);
        callback();

    }

    process(callback) {
        this.processing = true;

        switch (this.state) {
            case INITIAL_STATE:
                this.loadHeader();
                if (this.state !== HEADER_LOADED)
                    break;
            case HEADER_LOADED:
                this.loadSegment();
                if (this.state !== SEGMENT_LOADED)
                    break;
            case SEGMENT_LOADED:
                this.loadMeta();
                if (this.state !== META_LOADED)
                    break;
            default:

                if (this.shown === false && this.state === META_LOADED) {
                    console.log(this);
                    this.shown = true;
                    return;
                }
        }

        this.processing = false;
        callback();


    }

    loadMeta() {

        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.segment.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0x114D9B74: //Seek Head
                    if (!this.seekHead)
                        this.seekHead = new SeekHead(this.currentElement, this.dataInterface);
                    this.seekHead.load();
                    if (!this.seekHead.loaded)
                        return;
                    break;
                    
                case 0xEC: //VOid
                    if (!this.dataInterface.peekBytes(this.currentElement.size))
                        return;
                    else
                        this.dataInterface.skipBytes(this.currentElement.size);
                    
                    console.log("FOUND VOID, SKIPPING");
                    break;
                    
                case 0x1549A966: //Info
                    if (!this.segmentInfo)
                        this.segmentInfo = new SegmentInfo(this.currentElement, this.dataInterface);
                    this.segmentInfo.load();
                    if (!this.segmentInfo.loaded)
                        return;                    
                    break;    
                    
                case 0x1654AE6B: //Tracks
                    if (!this.tracks)
                        this.tracks = new Tracks(this.currentElement, this.dataInterface);
                    this.tracks.load();
                    if (!this.tracks.loaded)
                        return;
                    this.state = META_LOADED;//testing
                    break;  
                    
                default:
                    console.error("body element not found, skipping, id = " + this.currentElement.id);
                    break;

            }

            this.currentElement = null;
        }

        
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.state = META_LOADED;
    }

    loadSegment() {
        if(this.state !== HEADER_LOADED)
            console.error("HEADER NOT LOADED");
        
        if (!this.currentElement)
            this.currentElement = this.dataInterface.peekElement();

        if (!this.currentElement)
            return null;


        switch (this.currentElement.id) {

            case 0x18538067: // Segment
                console.log("segment found");
                this.segment = this.currentElement;
                //this.segmentOffset = segmentOffset;
                break;
            case 0xEC: // void
                console.log("void found");
                if (this.dataInterface.peekBytes(this.currentElement.size))
                    this.dataInterface.skipBytes();
                else
                    return null;
                break;
            default:
                console.warn("Global element not found, id: " + this.currentElement.id);
        }


        this.currentElement = null;
        this.segmentIsLoaded = true;
        this.state = SEGMENT_LOADED;
    }

    loadHeader() {
        //Header is small so we can read the whole thing in one pass or just wait for more data if necessary


        //only load it if we didnt already load it
        if (!this.elementEBML) {
            this.elementEBML = this.dataInterface.peekElement();
            if (!this.elementEBML)
                return null;

            if (this.elementEBML.id !== 0x1A45DFA3) { //EBML 
                //If the header has not loaded and the first element is not the header, do not continue
                console.warn('INVALID PARSE, HEADER NOT LOCATED');
            }
        }


        if (this.marker === NO_MARKER)
            this.marker = this.dataInterface.setNewMarker();

        while (this.dataInterface.getMarkerOffset(this.marker) < this.elementEBML.size) {
            if (!this.currentElement) {
                this.currentElement = this.dataInterface.peekElement();
                if (this.currentElement === null)
                    return null;
            }


            switch (this.currentElement.id) {

                case 0x4286: //EBMLVersion
                    var version = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (version !== null)
                        this.version = version;
                    else
                        return null;
                    break;

                case 0x42F7: //EBMLReadVersion 
                    var readVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (readVersion !== null)
                        this.readVersion = readVersion;
                    else
                        return null;
                    break;

                case 0x42F2: //EBMLMaxIDLength
                    var maxIdLength = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (maxIdLength !== null)
                        this.maxIdLength = maxIdLength;
                    else
                        return null;
                    break;

                case 0x42F3: //EBMLMaxSizeLength
                    var maxSizeLength = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (maxSizeLength !== null)
                        this.maxSizeLength = maxSizeLength;
                    else
                        return null;
                    break;

                case 0x4282: //DocType
                    var docType = this.dataInterface.readString(this.currentElement.size);
                    if (docType !== null)
                        this.docType = docType;
                    else
                        return null;
                    break;

                case 0x4287: //DocTypeVersion //worked
                    var docTypeVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (docTypeVersion !== null)
                        this.docTypeVersion = docTypeVersion;
                    else
                        return null;
                    break;

                case 0x4285: //DocTypeReadVersion //worked
                    var docTypeReadVersion = this.dataInterface.readUnsignedInt(this.currentElement.size);
                    if (docTypeReadVersion !== null)
                        this.docTypeReadVersion = docTypeReadVersion;
                    else
                        return null;
                    break;
                default:
                    console.warn("Header element not found, skipping");
                    break;

            }

            this.currentElement = null;
        }
        console.log("HEADER LOADED");
        this.dataInterface.removeMarker(this.marker);
        this.marker = NO_MARKER;
        this.headerIsLoaded = true;
        this.state = HEADER_LOADED;

    }

    parse() {

        var dataView = this.bufferQueue[0];
        var offset = this.headerSize;

        var end = offset + dataView.byteLength;
        var elementId;
        var elementSize;
        var elementOffset;


        elementId = VINT.read(dataView, offset);
        offset += elementId.width;
        elementSize = VINT.read(dataView, offset);
        offset += elementSize.width;
        console.log("Segment width = " + elementSize.data);

        if (elementId.raw !== 0x18538067) { //segment code
            console.warn('INVALID Segment');
        }




        while (offset < end) {

            //console.log(offset +","+ end);
            elementOffset = offset;
            elementId = VINT.read(dataView, offset);
            offset += elementId.width;
            elementSize = VINT.read(dataView, offset);
            offset += elementSize.width;
            console.log("id is" + elementId.raw);

            switch (elementId.raw) {
                case 0x1549A966: //Info
                    console.log("loading info");
                    var info = new SegmentInfo(dataView);
                    info.offset = elementOffset;
                    info.size = elementSize.data;
                    info.dataOffset = offset;
                    info.parse();
                    this.segmentInfo.push(info);
                    break;

                case 0x1654AE6B: //Tracks
                    this.tracks = new Tracks(dataView);
                    this.tracks.offset = elementOffset;
                    this.tracks.size = elementSize.data;
                    this.tracks.dataOffset = offset;
                    this.tracks.parse();
                    break;
                case 0x1C53BB6B: // Cues
                    this.cues = new Cues(this.dataView);
                    this.cues.offset = elementOffset;
                    this.cues.size = elementSize.data;
                    this.cues.dataOffset = offset;
                    break;
                case 0x114D9B74: //SeekHead
                    this.seekHead = new SeekHead(dataView);
                    this.seekHead.offset = elementOffset;
                    this.seekHead.size = elementSize.data;
                    this.seekHead.dataOffset = offset;
                    this.seekHead.parse();
                    break;

                case 0x1043A770: // Chapters
                    console.log("found chapters");
                    /*
                     this.chapters = new Chapters(this.dataView);
                     this.chapters.offset = elementOffset;
                     this.chapters.size = elementSize.data;
                     this.chapters.dataOffset = offset;
                     this.chapters.parse();
                     */
                    break;
                case 0x1254C367: //Tags
                    console.log("found tags");
                    /*
                     this.tags = new Tags(this.dataView);
                     this.tags.offset = elementOffset;
                     this.tags.size = elementSize.data;
                     this.tags.dataOffset = offset;
                     this.tags.parse();
                     */
                    break;
                    //For now just load cluster data here    
                case 0x1F43B675: //Cluster
                    var cluster;
                    console.log("found cluster");
                    /*
                     cluster = new Cluster(this.dataView);
                     cluster.offset = elementOffset;
                     cluster.size = elementSize.data;
                     cluster.dataOffset = offset;
                     cluster.parse();
                     this.cluster = cluster;
                     */
                    break;

                case 0xEC: //Void
                    //skip it
                    break;
                default:
                    console.warn("not found id = " + elementId.raw);
                    break;


            }





            offset += elementSize.data;

        }
    }

    parseInfo() {

    }

    parseHeader() {

        var dataView = this.bufferQueue[0];
        var offset = 0;//assume header starts at 0 for now
        var headerOffset = offset;
        var elementId;
        var elementSize;

        elementId = VINT.read(dataView, offset);
        offset += elementId.width;
        elementSize = VINT.read(dataView, offset);
        offset += elementSize.width;

        if (elementId.raw !== 0x1A45DFA3) { //EBML code
            // console.warn('INVALID HEADER');
        }



        var end = headerOffset + elementId.width + elementSize.width + elementSize.data; //total header size
        this.headerSize = end - 0;

        while (offset < end) {
            elementId = VINT.read(dataView, offset);
            offset += elementId.width;
            elementSize = VINT.read(dataView, offset);
            offset += elementSize.width;


            switch (elementId.raw) {
                case 0x4286: //EBMLVersion
                    this.version = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F7: //EBMLReadVersion
                    this.readVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F2: //EBMLMaxIDLength
                    this.maxIdLength = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x42F3: //EBMLMaxSizeLength
                    this.maxSizeLength = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x4282: //DocType
                    this.docType = OGVDemuxerWebM.readString(dataView, offset, elementSize.data);
                    break;
                case 0x4287: //DocTypeVersion
                    this.docTypeVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                case 0x4285: //DocTypeReadVersion
                    this.docTypeReadVersion = OGVDemuxerWebM.readUnsignedInt(dataView, offset, elementSize.data);
                    break;
                default:
                    console.warn("not found");
                    break;

            }
            offset += elementSize.data;
        }

        if (offset !== end) {
            console.warn("invalid file format");
        }



        if (this.docType === null || this.docTypeReadVersion <= 0 || this.docTypeVersion <= 0) {
            console.warn("invalid file format");
        }

        // Make sure EBMLMaxIDLength and EBMLMaxSizeLength are valid.
        if (this.maxIdLength <= 0 || this.maxIdLength > 4 || this.maxSizeLength <= 0 ||
                this.maxSizeLength > 8) {
            console.warn("invalid file format");
        }

        this.state = 1; //Set State To Decode Ready
        console.log(this);

    }

    static readFloat(dataView, offset, size) {
        //need to fix overflow for 64bit unsigned int
        if (offset < 0 && (size === 4 || size === 8)) {
            console.warn("invalid float size");
        }

        if (size === 4) {
            return dataView.getFloat32(offset);
        } else {
            return dataView.getFloat64(offset);
        }


    }

    static readUnsignedInt(dataView, offset, size) {
        //need to fix overflow for 64bit unsigned int
        if (offset < 0 || size <= 0 || size > 8) {
            console.warn("invalid file size");
        }


        var result = 0;
        var b;

        for (var i = 0; i < size; i++) {


            b = dataView.getUint8(offset);
            if (i === 0 && b < 0) {
                console.warn("invalid integer value");
            }

            result <<= 8;
            result |= b;

            offset++;
        }

        return result;
    }

    static readString(dataView, offset, size) {
        var tempString = '';
        for (var i = 0; i < size; i++) {
            tempString += String.fromCharCode(dataView.getUint8(offset + i));
        }
        return tempString;
    }
}
;


class Cues {

    constructor(dataView) {
        this.dataView = dataView;
        this.offset;
        this.dataOffset;
        this.size;
        this.segment;
        this.cuePoints = [];
        this.count;
        this.preloadCount;
        //this.position;
    }

    getCount() {
        return this.cuePoints.length;
    }

    init() {

    }

    preloadCuePoint() {

    }

    find() {

    }

    getFirst() {

    }

    getLast() {

    }

    getNext() {

    }

    getBlock() {

    }

    findOrPreloadCluster() {

    }

}







module.exports = OGVDemuxerWebM;